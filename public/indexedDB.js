export function checkDatabase() {
	if (!window.indexedDB) {
		console.log("Your browser doesn't support a stable version of IndexedDB.");
		return false;
	}
	return true;
}

const indexedDB =
	window.indexedDB ||
	window.mozIndexedDB ||
	window.webkitIndexedDB ||
	window.msIndexedDB ||
	window.simIndexedDB;

let db;
const request = indexedDB.open("budget", 1);

// register service worker

// check for service worker
// service worker lifecycle

//schema
request.onupgradeneeded = ({ target }) => {
	let db = target.result;
	db.createObjectStore("pending", { autoIncrement: true });
};

//if online check DB
// request.onsuccess = ({ target }) => {
request.onsuccess = function (event) {
	db = event.target.result;
	if (navigator.onLine) {
		checkDatabase();
	}
};

//deal with it
request.onerror = function (event) {
	console.log("Error!" + " " + event.target.errorCode);
};

//save record to db (called if offline - request fail)
function saveRecord(data) {
	const transaction = db.transaction(["pending"], "readWrite");
	const store = transaction.objectStore("pending");
	store.add(data);
}

//back online, send to mongo and clear pending (indexedDB)
function checkDatabase() {
	//below is failing, !!! check here
	const transaction = db.transaction(["pending"], "readWrite");
	const store = transaction.objectStore("pending");
	const getAllTrans = store.getAllTrans();

	getAllTrans.onsuccess = function () {
		if (getAllTrans.result.length > 0) {
			fetch("/api/transaction/bulk", {
				method: "POST",
				body: JSON.stringify(getAllTrans.result),
				headers: {
					Accept: "application/json, text/plain, */*",
					"Content-Type": "application/json",
				},
			})
				.then((response) => response.json())
				.then(() => {
					const transaction = db.transaction(["pending"], "readWrite");
					const store = transaction.objectStore("pending");
					store.clear();
				});
		}
	};
}
//listen for app coming back online
window.addEventListener("online", checkDatabase);
