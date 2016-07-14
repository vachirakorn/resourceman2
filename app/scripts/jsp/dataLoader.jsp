

<%@page import="com.mongodb.BasicDBList"%>
<%@page import="java.net.UnknownHostException"%>
<%@page import="com.mongodb.DBCursor"%>
<%@page import="com.mongodb.BasicDBObject"%>
<%@page import="com.mongodb.DBObject"%>
<%@page import="com.mongodb.DBCollection"%>
<%@page import="com.mongodb.DB"%>
<%@page import="com.mongodb.Mongo"%>
<%@page import="com.mongodb.util.JSON"%>
<%@page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>


<%!//connecting db method (prevent crash from multiple mongoDB connections to Mongo)
	private static DB db = null;
	// private static final String userDB = "sttdbusr";
	// private static final String passwordDB = "C0urtr00m$";
	private static final String dbname = "sttresourceman";
	private static final String host = "localhost";
	// private static final String host = "10.23.63.25";
	private static final int port = 27017;
	private static final Integer ASCENDING = new Integer(1);
	private static final Integer DESCENDING = new Integer(-1);
	private static final Integer SHOW = new Integer(1);
	private static final Integer HIDE = new Integer(1);
	boolean debug = true;

	private static DBCollection checkConnection(String collection) throws UnknownHostException {
		if (db == null) {
			db = (new Mongo(host, port)).getDB(dbname);
		}
		//boolean auth = db.authenticate(userDB, passwordDB.toCharArray());
		//if(auth) {
		return db.getCollection(collection);
		//	} else {
		//		return null;
		//	}
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

	private boolean isAdded(ArrayList arr, String id) {
		if (arr != null) {
			for (int index = 0; index < arr.size(); index++) {
				String str = (String) arr.get(index);
				if (str.matches(id)) {
					return true;
				}
			}
		}

		return false;

	}%>

<%
	DBCollection resource = checkConnection("resource");
	DBCollection project = checkConnection("project");
	String mode = request.getParameter("mode");

	if (debug) {
		System.out.println("\n\n\n\nREQUEST START");
		System.out.println("\n\n\n\nRANDOM :" + randomUuid());
		System.out.println("MODE : " + mode);
	}

	if (mode.equals("load")) {
		BasicDBObject data = new BasicDBObject();
		BasicDBObject fields = new BasicDBObject();
		//fields.put("_id", 0);

		DBCursor cursor = resource.find(data, fields);
		cursor.sort(new BasicDBObject().append("order", ASCENDING)); //sort by "order" field in ascending order
		DBObject buffer;

		out.print("[");
		while (cursor.hasNext()) {
			/* System.out.println(cursor.next()); */

			buffer = cursor.next();
			String resourceRowId = buffer.get("_id").toString();
			buffer.put("rid", resourceRowId); //create rid attr for using in the view
			buffer.removeField("_id");

			if (debug) {
				System.out.println("\nLOADING RESOURCE");
				System.out.println(buffer);
			}
			out.print(buffer);
			if (cursor.hasNext()) {
				out.print(",");
			}
		}
		out.print("]");

	} else if (mode.equals("taskSave")) {

		String resourceRowId = request.getParameter("id");
		String tasks = request.getParameter("tasks");

		if (debug) {
			System.out.println("\nTASK SAVE");
			System.out.println("tasks: " + JSON.parse(tasks));
			System.out.println("SAVE TO ROW ID: " + resourceRowId);
		}

		BasicDBObject update = new BasicDBObject();
		update.append("$set", new BasicDBObject().append("tasks", JSON.parse(tasks)));
		BasicDBObject query = new BasicDBObject().append("id", resourceRowId);
		DBObject findRowID = project.findOne(query);

		if (findRowID == null) {
			if (debug)
				System.out.println("SAVE IN RESOURCE");
			resource.update(query, update);
		} else {
			if (debug)
				System.out.println("SAVE IN PROJECT");
			project.update(query, update);
		}

	} else if (mode.equals("resourceSave")) {

		String row = request.getParameter("row");
		DBObject rowObj = (DBObject) JSON.parse(row);

		String resourceRowId = rowObj.get("id").toString();

		rowObj.removeField("oldParent");
		rowObj.removeField("oldId");
		rowObj.removeField("currentProject");
		rowObj.put("isNew", Boolean.FALSE);

		if (debug) {
			System.out.println("\nRESOURCE SAVE");
			System.out.println("rowObj: " + rowObj.toString());
			System.out.println("RESOURCE ID: " + resourceRowId);
		}

		BasicDBObject update = new BasicDBObject().append("$set", rowObj);
		BasicDBObject query = new BasicDBObject().append("id", resourceRowId);
		resource.update(query, update, true, false); //upsert
		DBCursor cursor = resource.find(new BasicDBObject().append("parent", resourceRowId));
		while (cursor.hasNext()) {
			DBObject resourceObj = cursor.next();
			resourceObj.put("team", rowObj.get("team").toString());
			resourceObj.put("filterName", rowObj.get("name").toString());

		}

	} else if (mode.equals("projectSave")) {

		String row = request.getParameter("row");
		DBObject rowObj = (DBObject) JSON.parse(row);
		String projectRowId = rowObj.get("id").toString();
		String projectName = rowObj.get("name").toString();

		if (Boolean.parseBoolean(rowObj.get("isNew").toString())
				&& project.find(new BasicDBObject().append("name", projectName)).hasNext()) {
			if (debug)
				System.out.println("\nDUPLICATED");
			out.print("DUPLICATED");
			return;
		}

		if (debug) {
			System.out.println("\nPROJECT SAVE");
			System.out.println("projectRowObj: " + rowObj.toString());
			System.out.println("PROJECT ID: " + projectRowId);
		}

		rowObj.put("isNew", Boolean.FALSE);
		BasicDBObject update = new BasicDBObject().append("$set", rowObj);
		BasicDBObject query = new BasicDBObject().append("id", projectRowId);
		project.update(query, update, true, false); //upsert

	} else if (mode.equals("projectLoad")) {

		if (debug)
			System.out.println("\nPROJECT LOAD");
		BasicDBObject data = new BasicDBObject();
		BasicDBObject fields = new BasicDBObject();
		ArrayList addedRow = new ArrayList();

		DBCursor cursor = project.find(data, fields);
		cursor.sort(new BasicDBObject().append("order", ASCENDING)); //sort by "projectOrder" field in ascending order
		DBObject projectObj;

		out.print("[");
		while (cursor.hasNext()) {

			//query project
			projectObj = cursor.next();

			//String projectRowRid = projectObj.get("_id").toString();
			String projectName = projectObj.get("name").toString();
			String projectRowId = projectObj.get("id").toString();
			String disguiseChildId = null;
			boolean hasChildDisguise = false;

			//projectObj.put("rid", projectRowRid);
			projectObj.removeField("_id");

			//print out project
			if (debug) {
				System.out.println("\nPROJECT LOADING");
				System.out.println("name : " + projectObj.get("name"));
				System.out.println("id : " + projectObj.get("id"));
				System.out.println("parent : " + projectObj.get("parent"));
			}

			out.print(projectObj);

			//find resource row who have tasks related to the project
			DBObject unwindCmd = (DBObject) new BasicDBObject("$unwind", "$tasks");
			DBObject matchCmd = (DBObject) new BasicDBObject("$match",
					new BasicDBObject("tasks.project", projectObj.get("name")));
			DBObject groupCmd = (DBObject) new BasicDBObject("$group",
					new BasicDBObject("_id", new BasicDBObject("parent", "$parent").append("id", "$id"))
							.append("id", new BasicDBObject("$first", "$id"))
							.append("parent", new BasicDBObject("$first", "$parent"))
							.append("order", new BasicDBObject("$first", "$order"))
							.append("name", new BasicDBObject("$first", "$name"))
							.append("filterName", new BasicDBObject("$first", "$filterName"))
							.append("tel", new BasicDBObject("$first", "$tel"))
							.append("email", new BasicDBObject("$first", "$email"))
							.append("utilization", new BasicDBObject("$first", "$utilization"))
							.append("isChildRow", new BasicDBObject("$first", "$isChildRow"))
							.append("isNew", new BasicDBObject("$first", "$isNew"))
							.append("content", new BasicDBObject("$first", "$content"))
							.append("team", new BasicDBObject("$first", "$team"))
							.append("columnKeys", new BasicDBObject("$first", "$columnKeys"))
							.append("columnContents", new BasicDBObject("$first", "$columnContents"))
							.append("tasks", new BasicDBObject("$push", "$tasks")));

			DBObject sortCmd = (DBObject) new BasicDBObject("$sort", new BasicDBObject("order", ASCENDING));
			List aggregateCommandList = new ArrayList();

			aggregateCommandList.add(unwindCmd);
			aggregateCommandList.add(matchCmd);
			aggregateCommandList.add(groupCmd);
			aggregateCommandList.add(sortCmd);

			Iterable resourceObjs = resource.aggregate(aggregateCommandList).results();
			Iterator itr = resourceObjs.iterator();
			while (itr.hasNext()) {
				DBObject resourceObj = (DBObject) itr.next();
				String resourceRowId = resourceObj.get("id").toString();


				resourceObj.put("currentProject", projectName);
				resourceObj.removeField("_id");

				String parentRowId = resourceObj.get("parent").toString();

				if (parentRowId.equalsIgnoreCase("")) {
					//parent row has no parentRowId
					//NOTE : we have always found parent resource row before child resource row
					disguiseChildId = null;
					hasChildDisguise = false;

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
					//child row has parentRowId
					DBObject parentRowObj = resource.findOne(new BasicDBObject("id", parentRowId));
					String parentRowObjId = parentRowObj.get("id").toString();
					String parentRowObjName = parentRowObj.get("name").toString();
					String parentRowObjContent = parentRowObj.get("content").toString();

					BasicDBList resourceTasks = (BasicDBList) resourceObj.get("tasks");

					//Fixed bug wasted parent row
					//NOTE: when parent has no tasks, its child row disguise to parent row
					if (!isAdded(addedRow, parentRowObjId) && !isAdded(addedRow, resourceRowId)) {

						addedRow.add(parentRowObjId);
						addedRow.add(resourceRowId);
						//disguise to parent row
						resourceObj.put("parent", projectRowId);
						resourceObj.put("oldParent", parentRowObjId);
						resourceObj.put("currentProject", projectName);
						resourceObj.put("content", parentRowObjContent);
						resourceObj.put("name",parentRowObjName);
						resourceObj.put("isChildRow",Boolean.FALSE);

						disguiseChildId = resourceRowId;
						hasChildDisguise = true;

						resourceObj.removeField("_id");

						if (debug) {
							System.out.println("\n\nADDED PARENT ROW NO TASK ");
							System.out.println("name : " + resourceObj.get("name"));
							System.out.println("id : " + resourceObj.get("id"));
							System.out.println("oldParent : " + resourceObj.get("oldParent"));
						}

						out.print(",");
						out.print(resourceObj.toString());
					} else if (!isAdded(addedRow, resourceRowId) && hasChildDisguise) {
						addedRow.add(resourceRowId);
						if (debug) {
							System.out.println("\nLOADING RESOURCE");
							System.out.println("name : " + resourceObj.get("name"));
							System.out.println("id : " + resourceObj.get("id"));
							System.out.println("parent : " + resourceObj.get("parent"));
						}

						resourceObj.put("parent", disguiseChildId);
						out.print(",");
						out.print(resourceObj);

					} else if (!isAdded(addedRow, resourceRowId) && !hasChildDisguise) {
						addedRow.add(resourceRowId);
						if (debug) {
							System.out.println("\nLOADING RESOURCE");
							System.out.println("name : " + resourceObj.get("name"));
							System.out.println("id : " + resourceObj.get("id"));
							System.out.println("parent : " + resourceObj.get("parent"));
						}
						resourceObj.put("parent", parentRowObjId);
						out.print(",");
						out.print(resourceObj);

					}

				}

			}

			if (cursor.hasNext())
				out.print("," + new BasicDBObject().append("end", Boolean.TRUE).toString() + ",");
			else
				out.print("," + new BasicDBObject("end", Boolean.TRUE).toString());
			//clear when project change
			addedRow.clear();
		}
		out.print("]");

	} else if (mode.equals("resourceDelete")) {

		String resourceRowId = request.getParameter("id");
		if (debug)
			System.out.println("remove ID: " + resourceRowId);

		DBCursor cursor = resource.find(new BasicDBObject("parent", resourceRowId));

		while (cursor.hasNext()) {
			DBObject buffer = cursor.next();
			if (debug)
				System.out.println("remove child: " + buffer.get("name").toString());
			resource.remove(new BasicDBObject().append("id", buffer.get("id").toString()));
		}
		resource.remove(new BasicDBObject().append("id", resourceRowId));

	} else if (mode.equals("projectDelete")) {

		String projectRowId = request.getParameter("id");
		project.remove(new BasicDBObject().append("id", projectRowId));

	} else if (mode.equals("getProjectsName")) {

		if (debug)
			System.out.println("\nGET PROJECT NAME");
		DBCursor cursor = project.find(new BasicDBObject(), new BasicDBObject("name", SHOW));
		out.print("[");
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			if (debug)
				System.out.println(obj);
			out.print(obj);
			if (cursor.hasNext())
				out.print(",");
		}
		out.print("]");

	} else if (mode.equals("changeOrder")) {

		if (debug)
			System.out.println("\nCHANGE ROW ORDER");
		//String row = request.getParameter("row");
		//DBObject rowObj = (DBObject) JSON.parse(row);
		Integer oldOrder = new Integer(request.getParameter("oldOrder"));
		Integer newOrder = new Integer(request.getParameter("newOrder"));
		boolean isProjectRow = Boolean.parseBoolean(request.getParameter("isProjectRow"));
		//move row down
		if (oldOrder.compareTo(newOrder) < 0) {
			BasicDBObject query = new BasicDBObject("order", oldOrder);
			BasicDBObject update = new BasicDBObject("$set", new BasicDBObject("order", new Integer(-9999)));

			if (isProjectRow)
				project.update(query, update, false, false);
			resource.update(query, update, false, false);

			query = new BasicDBObject("order", new BasicDBObject("$gt", oldOrder).append("$lte", newOrder));
			update = new BasicDBObject("$inc", new BasicDBObject("order", DESCENDING));

			if (isProjectRow)
				project.update(query, update, false, true);
			else
				resource.update(query, update, false, true);

			query = new BasicDBObject("order", new Integer(-9999));
			update = new BasicDBObject("$set", new BasicDBObject("order", newOrder));

			if (isProjectRow)
				project.update(query, update, false, true);
			else
				resource.update(query, update, false, true);
		}
		//move row up
		else if (newOrder.compareTo(oldOrder) < 0) {
			BasicDBObject query = new BasicDBObject("order", oldOrder);
			BasicDBObject update = new BasicDBObject("$set", new BasicDBObject("order", new Integer(-9999)));

			if (isProjectRow)
				project.update(query, update, false, false);
			else
				resource.update(query, update, false, false);

			query = new BasicDBObject("order", new BasicDBObject("$gte", newOrder).append("$lt", oldOrder));
			update = new BasicDBObject("$inc", new BasicDBObject().append("order", SHOW));

			if (isProjectRow)
				project.update(query, update, false, true);
			else
				resource.update(query, update, false, true);

			query = new BasicDBObject("order", new Integer(-9999));
			update = new BasicDBObject("$set", new BasicDBObject("order", newOrder));

			if (isProjectRow)
				project.update(query, update, false, true);
			else
				resource.update(query, update, false, true);
		}

	} else {
		if (debug)
			System.out.println("There are no request");
	}
%>
