const indexedDB = 
window.indexedDB ||
window.mozIndexedDB ||
window.webkitIndexedDB ||
window.msIndexedDB ||
window.simIndexedDB;

let db;
const request = indexedDB.open("budget", 1);

//schema
request.onupgradeneeded = ({ target }) => {
    let db = target.result;
    db.createObjectStore("pending", { autoIncrement: true});
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
request.onerror = function(event) {
    console.log("Error!" + " " + event.target.errorCode)
}

//save record to db (called if offline - request fail)
function saveRecord(record) {  
    const transaction = db.transaction(["pending"], "readWrite"); 
    const store = transaction.objectStore("pending");
    store.add(record);
}

//back online, send to mongo and clear pending (indexedDB)
function checkDatabase() {
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
                    "Content-Type": "application/json"
                }
            })
    .then(response => response.json())
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