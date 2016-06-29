<%@page import="org.eclipse.jdt.internal.compiler.ast.ThrowStatement"%>
<%@page import="java.net.UnknownHostException"%>
<%@page import="javax.websocket.RemoteEndpoint.Basic"%>
<%@page import="com.mongodb.DBCursor"%>
<%@page import="com.mongodb.BasicDBObject"%>
<%@page import="com.mongodb.DBObject"%>
<%@page import="com.mongodb.DBCollection"%>
<%@page import="com.mongodb.DB"%>
<%@page import="com.mongodb.Mongo"%>
<%@page import="com.mongodb.util.JSON"%>
<%@page import="org.bson.types.ObjectId"%>

<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>

<%!//connecting db method (prevent crash from multiple mongoDB connections to Mongo)
	private static DB db = null;
	private static String dbname = "resourceman";
	private static String host = "localhost";
	private static int port = 27017;

	private static DBCollection checkConnection(String collection) throws UnknownHostException {
		if (db == null) {
			db = (new Mongo(host, port)).getDB(dbname);
		}
		return db.getCollection(collection);
	}%>

<%
	DBCollection resource = checkConnection("resource");
	DBCollection project = checkConnection("project");
	String mode = request.getParameter("mode");

	System.out.println("\n\n\n\nREQUEST START");
	System.out.println("MODE : " + mode);
	if (mode.equals("load")) {
		BasicDBObject data = new BasicDBObject();
		BasicDBObject fields = new BasicDBObject();
		//fields.put("_id", 0);

		DBCursor cursor = resource.find(data, fields);
		cursor.sort(new BasicDBObject("order", 1)); //sort by "order" field in ascending order
		DBObject buffer;

		out.print("[");
		while (cursor.hasNext()) {
			/* System.out.println(cursor.next()); */

			buffer = cursor.next();
			String resourceRowId = buffer.get("_id").toString();
			buffer.put("rid", resourceRowId); //create rid attr for using in the view
			buffer.removeField("_id");
			System.out.println("\nLOADING RESOURCE");
			System.out.println(buffer);
			out.print(buffer);
			if (cursor.hasNext()) {
				out.print(",");
			}
		}
		out.print("]");

	} else if (mode.equals("taskSave")) {

		String resourceRowId = request.getParameter("rid");
		//BasicDBObject tasksObjArr = new BasicDBObject() ;
		String tasks = request.getParameter("tasks");

		System.out.println("\nTASK SAVE");
		System.out.println("tasks: " + JSON.parse(tasks));
		System.out.println("SAVE TO ROW ID: " + resourceRowId);
		BasicDBObject update = new BasicDBObject();
		update.append("$set", new BasicDBObject().append("tasks", JSON.parse(tasks)));
		BasicDBObject query = new BasicDBObject().append("_id", new ObjectId(resourceRowId));

		DBObject findRowID = project.findOne(query);
		if (findRowID == null) {
			System.out.println("SAVE IN RESOURCE");
			resource.update(query, update);
		} else {
			System.out.println("SAVE IN PROJECT");
			project.update(query, update);
		}

	} else if (mode.equals("resourceSave")) {

		String row = request.getParameter("row");
		DBObject rowObj = (DBObject) JSON.parse(row);
		String name = rowObj.get("name").toString();
		String resourceRowId = rowObj.get("rid").toString();
		/* if (resourceRowId.equals("0") && resource.findOne(new BasicDBObject("name", name)) != null) {
			System.out.println("error duplicate resource name");
			out.print("duplicate resource name exists");
		} else { */


			rowObj.removeField("rid");
			rowObj.removeField("id");

			//rowObj.removeField("parent");

			BasicDBObject update = new BasicDBObject().append("$set", rowObj);
			System.out.println("\nRESOURCE SAVE");
			System.out.println("rowObj: " + rowObj.toString());
			System.out.println("RESOURCE ID: " + resourceRowId);
			if (resourceRowId.equals("0")) {
				BasicDBObject query = new BasicDBObject().append("_id", new ObjectId());
				resource.update(query, update, true, false); //upsert
				DBCursor cursor = resource.find(new BasicDBObject()).sort(new BasicDBObject("_id", -1))
						.limit(1);
				DBObject newrow = cursor.next();
				ObjectId rid = (ObjectId) newrow.get("_id");
				System.out.println("RESPONSE NEW ROWID : " + rid.toString());
				out.print(rid.toString());
			} else {
				BasicDBObject query = new BasicDBObject().append("_id", new ObjectId(resourceRowId));
				resource.update(query, update, true, false); //upsert
			}
		//}

	} else if (mode.equals("projectSave")) {

		String row = request.getParameter("row");
		DBObject rowObj = (DBObject) JSON.parse(row);
		String projectRowId = rowObj.get("rid").toString();
		rowObj.removeField("rid");
		rowObj.removeField("id");

		BasicDBObject update = new BasicDBObject().append("$set", rowObj);
		System.out.println("\nPROJECT SAVE");
		System.out.println("projectRowObj: " + rowObj.toString());
		System.out.println("PROJECT ID: " + projectRowId);
		if (projectRowId.equals("0")) {
			BasicDBObject query = new BasicDBObject().append("_id", new ObjectId());
			project.update(query, update, true, false); //upsert
			DBCursor cursor = project.find(new BasicDBObject()).sort(new BasicDBObject("_id", -1)).limit(1);
			DBObject newrow = cursor.next();
			ObjectId prid = (ObjectId) newrow.get("_id");
			System.out.println("RESPONSE NEW PROJECT ROWID : " + prid.toString());
			out.print(prid.toString());
		} else {
			BasicDBObject query = new BasicDBObject().append("_id", new ObjectId(projectRowId));
			project.update(query, update, true, false); //upsert
		}

	} else if (mode.equals("projectLoad")) {
		System.out.println("\nPROJECT LOAD");
		BasicDBObject data = new BasicDBObject();
		BasicDBObject fields = new BasicDBObject();
		//fields.put("_id", 0);

		DBCursor cursor = project.find(data, fields);
		cursor.sort(new BasicDBObject("projectOrder", 1)); //sort by "projectOrder" field in ascending order
		DBObject projectObj;

		out.print("[");
		while (cursor.hasNext()) {

			//query project
			projectObj = cursor.next();
			String projectRowId = projectObj.get("_id").toString();
			projectObj.put("rid", projectRowId); //create rid attr for using in the view
			projectObj.removeField("_id");
			System.out.println("\nPROJECT LOADING");
			System.out.println(projectObj);
			out.print(projectObj);

			//find resources who have tasks related to the project
			Iterable<DBObject> resourceObjs = resource.aggregate(Arrays.asList(
					(DBObject) new BasicDBObject("$unwind", "$tasks"),
					(DBObject) new BasicDBObject("$match",new BasicDBObject("tasks.project",projectObj.get("name"))),

					(DBObject) new BasicDBObject("$group",new BasicDBObject("_id", "$_id")
									.append("order", new BasicDBObject("$first", "$order"))
									.append("name", new BasicDBObject("$first", "$name"))
									.append("tel", new BasicDBObject("$first", "$tel"))
									.append("email", new BasicDBObject("$first", "$email"))
									.append("utilization", new BasicDBObject("$first", "$utilization"))
									.append("tasks", new BasicDBObject("$push", "$tasks"))),
					(DBObject) new BasicDBObject("$sort", new BasicDBObject("order", 1))
					)).results();

			for (DBObject resourceObj : resourceObjs) {
				System.out.println("\nLOADING RESOURCE");
				String resourceRowId = resourceObj.get("_id").toString();
				resourceObj.put("rid", resourceRowId); //create rid attr for using in the view
				resourceObj.put("parent", projectObj.get("name"));
				resourceObj.removeField("_id");
				System.out.println(",");
				System.out.println(resourceObj);
				out.print(",");
				out.print(resourceObj);

			}

			if (cursor.hasNext()) {
				System.out.println(",");
				out.print(",");
			}

		}
		out.print("]");

	} else if (mode.equals("resourceDelete")) {

		String resourceRowId = request.getParameter("rid");
		resource.remove(new BasicDBObject().append("_id", new ObjectId(resourceRowId)));

	} else if (mode.equals("projectDelete")) {

		String projectRowId = request.getParameter("rid");
		project.remove(new BasicDBObject().append("_id", new ObjectId(projectRowId)));

	} else if (mode.equals("getProjectsName")) {

		System.out.println("\nGET PROJECT NAME");
		DBCursor cursor = project.find(new BasicDBObject(), new BasicDBObject("name", 1));
		out.print("[");
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			System.out.println(obj);
			out.print(obj);
			if (cursor.hasNext())
				out.print(",");
		}
		out.print("]");

	}else if (mode.equals("changeOrder")) {

		System.out.println("\nCHANGE ROW ORDER");
		//String row = request.getParameter("row");
		//DBObject rowObj = (DBObject) JSON.parse(row);
		int oldOrder = Integer.parseInt(request.getParameter("oldOrder"));
		int newOrder = Integer.parseInt(request.getParameter("newOrder"));


    //move row down
		if(oldOrder < newOrder){
    BasicDBObject  query = new BasicDBObject("order",oldOrder);
  	BasicDBObject	update = new BasicDBObject("$set",new BasicDBObject("order",-9999));
  	resource.update(query,update,false,false);
		query = new BasicDBObject("order",new BasicDBObject("$gt",oldOrder).append("$lte", newOrder));
		update = new BasicDBObject("$inc",new BasicDBObject("order",-1));
		resource.update(query,update,false,true);
		query = new BasicDBObject("order",-9999);
		update = new BasicDBObject("$set",new BasicDBObject("order",newOrder));
		resource.update(query,update,false,true);
		}
    //move row up
		else if(newOrder < oldOrder){
      BasicDBObject query = new BasicDBObject("order",oldOrder);
			BasicDBObject update = new BasicDBObject("$set",new BasicDBObject("order",-9999));
			resource.update(query,update,false,false);
			query = new BasicDBObject("order",new BasicDBObject("$gte",newOrder).append("$lt", oldOrder));
			update = new BasicDBObject("$inc",new BasicDBObject("order",1));
			resource.update(query,update,false,true);
			query = new BasicDBObject("order",-9999);
			update = new BasicDBObject("$set",new BasicDBObject("order",newOrder));
			resource.update(query,update,false,true);
		}



	} else {
		System.out.println("There are no request");
	}
%>
