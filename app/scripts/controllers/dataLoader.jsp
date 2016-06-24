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

<%!
//connecting db method (prevent crash from multiple mongoDB connections to Mongo)
private static DB db = null;
private static String dbname  = "resourceman";
private static String host = "localhost";
private static int port = 27017;

private static DBCollection checkConnection(String collection) throws UnknownHostException{
    if(db == null){
        db = (new Mongo(host,port)).getDB(dbname);
    }
    return db.getCollection(collection);
}
 %>

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
		if(findRowID==null){
			System.out.println("SAVE IN RESOURCE");
			resource.update(query, update);
		}else{
			System.out.println("SAVE IN PROJECT");
			project.update(query, update);
		}


	} else if (mode.equals("rowSave")) {

		String row = request.getParameter("row");
		DBObject rowObj = (DBObject) JSON.parse(row);
		String resourceRowId = rowObj.get("rid").toString();
		rowObj.removeField("rid");
		rowObj.removeField("id");

		BasicDBObject update = new BasicDBObject().append("$set", rowObj);
		System.out.println("\nRESOURCE SAVE");
		System.out.println("rowObj: " + rowObj.toString());
		System.out.println("RESOURCE ID: " + resourceRowId);
		if (resourceRowId.equals("0")) {
			BasicDBObject query = new BasicDBObject().append("_id", new ObjectId());
			resource.update(query, update, true, false); //upsert
		} else {
			BasicDBObject query = new BasicDBObject().append("_id", new ObjectId(resourceRowId));
			resource.update(query, update, true, false); //upsert
		}

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
		} else {
			BasicDBObject query = new BasicDBObject().append("_id", new ObjectId(projectRowId));
			project.update(query, update, true, false); //upsert
		}

	} else if (mode.equals("projectLoad")){
		System.out.println("\nPROJECT LOAD");
		BasicDBObject data = new BasicDBObject();
		BasicDBObject fields = new BasicDBObject();
		//fields.put("_id", 0);

		DBCursor cursor = project.find(data, fields);
		cursor.sort(new BasicDBObject("order", 1)); //sort by "order" field in ascending order
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
		            (DBObject) new BasicDBObject( "$unwind", "$tasks"),
		            (DBObject) new BasicDBObject("$match", new BasicDBObject("tasks.project",projectObj.get("name") )),
		            (DBObject) new BasicDBObject("$sort", new BasicDBObject("order", -1)),
		            (DBObject) new BasicDBObject("$group", new BasicDBObject("_id", "$_id").append("order", new BasicDBObject("$first","$order"))
		                                                                                .append("name", new BasicDBObject("$first","$name"))
		                                                                                .append("tel", new BasicDBObject("$first","$tel"))
		                                                                                .append("email", new BasicDBObject("$first","$email"))
		                                                                                .append("utilization", new BasicDBObject("$first","$utilization"))
		                                                                                .append("tasks", new BasicDBObject("$push","$tasks")))
		        )).results();

		    for (DBObject resourceObj : resourceObjs)
		    {
		    	System.out.println("\nLOADING RESOURCE");
				String resourceRowId = resourceObj.get("_id").toString();
				resourceObj.put("rid", resourceRowId); //create rid attr for using in the view
				resourceObj.put("parent",projectObj.get("name"));
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





	} else {
		System.out.println("There are no request");
	}
%>
