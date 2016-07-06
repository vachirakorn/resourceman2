<%@page import="com.google.gson.JsonArray"%>
<%@page import="java.awt.List"%>
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
	}

	public static boolean useArraysBinarySearch(String[] arr, String targetValue) {
		int a = Arrays.binarySearch(arr, targetValue);
		if (a > 0)
			return true;
		else
			return false;
	}

	private String random4() {
		Random r = new Random();
		StringBuffer sb = new StringBuffer();
		while (sb.length() < 4) {
			sb.append(Integer.toHexString(r.nextInt()));
		}

		return sb.toString().substring(0, 4);
	}

	private String randomUuid() {
		return this.random4() + this.random4() + '-' + this.random4() + '-' + this.random4() + '-' + this.random4()
				+ '-' + this.random4() + this.random4() + this.random4();
	}

	private boolean isAdded(ArrayList<String> arr, String id) {
		for (String s : arr) {
			if (s.matches(id)) {
				return true;
			}

		}
		return false;

	}%>

<%
	DBCollection resource = checkConnection("resource");
	DBCollection project = checkConnection("project");
	String mode = request.getParameter("mode");

	System.out.println("\n\n\n\nREQUEST START");
	System.out.println("\n\n\n\nRANDOM :" + randomUuid());
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

		String resourceRowId = request.getParameter("id");
		//BasicDBObject tasksObjArr = new BasicDBObject() ;
		String tasks = request.getParameter("tasks");

		System.out.println("\nTASK SAVE");
		System.out.println("tasks: " + JSON.parse(tasks));
		System.out.println("SAVE TO ROW ID: " + resourceRowId);
		BasicDBObject update = new BasicDBObject();
		update.append("$set", new BasicDBObject().append("tasks", JSON.parse(tasks)));
		BasicDBObject query = new BasicDBObject().append("id", resourceRowId);

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
		String resourceRowId = rowObj.get("id").toString();
		/* if (resourceRowId.equals("0") && resource.findOne(new BasicDBObject("name", name)) != null) {
			System.out.println("error duplicate resource name");
			out.print("duplicate resource name exists");
		} else { */

		rowObj.removeField("oldParent");
		rowObj.removeField("oldId");
		rowObj.removeField("currentProject");

		//rowObj.removeField("parent");

		BasicDBObject update = new BasicDBObject().append("$set", rowObj);
		System.out.println("\nRESOURCE SAVE");
		System.out.println("rowObj: " + rowObj.toString());
		System.out.println("RESOURCE ID: " + resourceRowId);
		/* if (resourceRowId.equals("0")) {
			BasicDBObject query = new BasicDBObject().append("id","0");
			resource.update(query, update, true, false); //upsert
			DBCursor cursor = resource.find(new BasicDBObject()).sort(new BasicDBObject("_id", -1))
					.limit(1);
			DBObject newrow = cursor.next();
			String id = newrow.get("id");
			System.out.println("RESPONSE NEW ROWID : " + id.toString());
			out.print(id.toString());
		} else { */
		BasicDBObject query = new BasicDBObject().append("id", resourceRowId);
		resource.update(query, update, true, false); //upsert
		//}
		//}

	} else if (mode.equals("projectSave")) {

		String row = request.getParameter("row");
		DBObject rowObj = (DBObject) JSON.parse(row);
		String projectRowId = rowObj.get("id").toString();
		//rowObj.removeField("id");
		//rowObj.removeField("id");

		BasicDBObject update = new BasicDBObject().append("$set", rowObj);
		System.out.println("\nPROJECT SAVE");
		System.out.println("projectRowObj: " + rowObj.toString());
		System.out.println("PROJECT ID: " + projectRowId);
		/* 	if (projectRowId.equals("0")) {
				BasicDBObject query = new BasicDBObject().append("_id", new ObjectId());
				project.update(query, update, true, false); //upsert
				DBCursor cursor = project.find(new BasicDBObject()).sort(new BasicDBObject("_id", -1)).limit(1);
				DBObject newrow = cursor.next();
				ObjectId pid = (ObjectId) newrow.get("_id");
				System.out.println("RESPONSE NEW PROJECT ROWID : " + pid.toString());
				out.print(pid.toString());
			} else { */
		BasicDBObject query = new BasicDBObject().append("id", projectRowId);
		project.update(query, update, true, false); //upsert
		//}

	} else if (mode.equals("projectLoad")) {

		System.out.println("\nPROJECT LOAD");
		BasicDBObject data = new BasicDBObject();
		BasicDBObject fields = new BasicDBObject();
		ArrayList<String> addedRow = new ArrayList<String>();

		//fields.put("_id", 0);

		DBCursor cursor = project.find(data, fields);
		cursor.sort(new BasicDBObject("order", 1)); //sort by "projectOrder" field in ascending order
		DBObject projectObj;

		out.print("[");
		while (cursor.hasNext()) {

			//query project
			projectObj = cursor.next();

			String projectRowRid = projectObj.get("_id").toString();
			String projectName = projectObj.get("name").toString();
			String projectRowId = projectObj.get("id").toString();

			projectObj.put("rid", projectRowRid);
			projectObj.removeField("_id");

			//print out project
			System.out.println("\nPROJECT LOADING");
			System.out.println("name : " + projectObj.get("name"));
			System.out.println("id : " + projectObj.get("id"));
			System.out.println("parent : " + projectObj.get("parent"));

			out.print(projectObj);

			//find resource row who have tasks related to the project
			Iterable<DBObject> resourceObjs = resource
					.aggregate(Arrays.asList((DBObject) new BasicDBObject("$unwind", "$tasks"),
							(DBObject) new BasicDBObject("$match",
									new BasicDBObject("tasks.project", projectObj.get("name"))),

							(DBObject) new BasicDBObject("$group",
									new BasicDBObject("_id",
											new BasicDBObject("parent", "$parent").append("id", "$id"))
													.append("id", new BasicDBObject("$first", "$id"))
													.append("rid", new BasicDBObject("$first", "$_id"))
													.append("parent", new BasicDBObject("$first", "$parent"))
													.append("order", new BasicDBObject("$first", "$order"))
													.append("name", new BasicDBObject("$first", "$name"))
													.append("tel", new BasicDBObject("$first", "$tel"))
													.append("email", new BasicDBObject("$first", "$email"))
													.append("utilization",
															new BasicDBObject("$first", "$utilization"))
													.append("tasks", new BasicDBObject("$push", "$tasks"))),
							(DBObject) new BasicDBObject("$sort", new BasicDBObject("order", 1))))
					.results();

			for (DBObject resourceObj : resourceObjs) {

				String resourceRowId = resourceObj.get("id").toString();
				String resourceRowRid = resourceObj.get("rid").toString();
				resourceObj.put("rid", resourceRowRid);
				resourceObj.put("currentProject", projectName);
				resourceObj.removeField("_id");

				String parentRowId = resourceObj.get("parent").toString();

				if (parentRowId.equalsIgnoreCase("")) {
					//main resource row has no parent row
					//note : we have always found main resource row before sub resource row

					resourceObj.put("parent", projectRowId);
					resourceObj.put("oldParent", "");
					resourceObj.put("currentProject", projectName);
					resourceObj.removeField("_id");
					if (!isAdded(addedRow, resourceRowId)) {
						addedRow.add(resourceRowId);
						out.print(",");
						out.print(resourceObj);
					}

				} else {
					//sub resource row has parent row
					DBObject parentRowObj = resource.findOne(new BasicDBObject("id", parentRowId));
					String parentRowObjId = parentRowObj.get("id").toString();
					//parent row has no tasks related to project
					if (!isAdded(addedRow, parentRowObjId)) {

						addedRow.add(parentRowObjId);
						parentRowObj.put("parent", projectRowId);
						parentRowObj.put("oldParent", "");
						parentRowObj.put("currentProject", projectName);
						parentRowObj.removeField("_id");
						//remove tasks !
						parentRowObj.removeField("tasks");

						System.out.println("\n\nADDED PARENT ROW NO TASK ");
						System.out.println("name : " + parentRowObj.get("name"));
						System.out.println("id : " + parentRowObj.get("id"));

						out.print(",");
						out.print(parentRowObj.toString());
					}

					//print sub resource row
					if (!isAdded(addedRow, resourceRowId)) {
						addedRow.add(resourceRowId);

						System.out.println("\nLOADING RESOURCE");
						System.out.println("name : " + resourceObj.get("name"));
						System.out.println("id : " + resourceObj.get("id"));
						System.out.println("parent : " + resourceObj.get("parent"));

						out.print(",");
						out.print(resourceObj);

					}

				}

			}

			if (cursor.hasNext()) out.print("," + new BasicDBObject("end", true).toString() + ",");
			else out.print("," + new BasicDBObject("end", true).toString());
			//clear when project change
			addedRow.clear();
		}
		out.print("]");

	} else if (mode.equals("resourceDelete")) {

		String resourceRowId = request.getParameter("id");
		resource.remove(new BasicDBObject().append("id", resourceRowId));

	} else if (mode.equals("projectDelete")) {

		String projectRowId = request.getParameter("id");
		project.remove(new BasicDBObject().append("id", projectRowId));

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

	} else if (mode.equals("changeOrder")) {

		System.out.println("\nCHANGE ROW ORDER");
		//String row = request.getParameter("row");
		//DBObject rowObj = (DBObject) JSON.parse(row);
		int oldOrder = Integer.parseInt(request.getParameter("oldOrder"));
		int newOrder = Integer.parseInt(request.getParameter("newOrder"));
		boolean isProjectRow = Boolean.parseBoolean(request.getParameter("isProjectRow"));
		//move row down
		if (oldOrder < newOrder) {
			BasicDBObject query = new BasicDBObject("order", oldOrder);
			BasicDBObject update = new BasicDBObject("$set", new BasicDBObject("order", -9999));

			if (isProjectRow)
				project.update(query, update, false, false);
			resource.update(query, update, false, false);

			query = new BasicDBObject("order", new BasicDBObject("$gt", oldOrder).append("$lte", newOrder));
			update = new BasicDBObject("$inc", new BasicDBObject("order", -1));

			if (isProjectRow)
				project.update(query, update, false, true);
			else
				resource.update(query, update, false, true);

			query = new BasicDBObject("order", -9999);
			update = new BasicDBObject("$set", new BasicDBObject("order", newOrder));

			if (isProjectRow)
				project.update(query, update, false, true);
			else
				resource.update(query, update, false, true);
		}
		//move row up
		else if (newOrder < oldOrder) {
			BasicDBObject query = new BasicDBObject("order", oldOrder);
			BasicDBObject update = new BasicDBObject("$set", new BasicDBObject("order", -9999));

			if (isProjectRow)
				project.update(query, update, false, false);
			else
				resource.update(query, update, false, false);

			query = new BasicDBObject("order", new BasicDBObject("$gte", newOrder).append("$lt", oldOrder));
			update = new BasicDBObject("$inc", new BasicDBObject("order", 1));

			if (isProjectRow)
				project.update(query, update, false, true);
			else
				resource.update(query, update, false, true);

			query = new BasicDBObject("order", -9999);
			update = new BasicDBObject("$set", new BasicDBObject("order", newOrder));

			if (isProjectRow)
				project.update(query, update, false, true);
			else
				resource.update(query, update, false, true);
		}

	} else {
		System.out.println("There are no request");
	}
%>
