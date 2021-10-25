 importScripts('https://www.gstatic.com/firebasejs/4.9.0/firebase-app.js');
 importScripts('https://www.gstatic.com/firebasejs/4.9.0/firebase-messaging.js');

var idbDatabase;
var IDB_VERSION = 1;
var STOP_RETRYING_AFTER = 86400000; // One day, in milliseconds.
var STORE_NAME = 'instagramNotification';

// This is basic boilerplate for interacting with IndexedDB. Adapted from
// https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
function openDatabase() {
  var indexedDBOpenRequest = indexedDB.open('ec-pwa', IDB_VERSION);

  // This top-level error handler will be invoked any time there's an IndexedDB-related error.
  indexedDBOpenRequest.onerror = function(error) {
    console.error('IndexedDB error:', error);
  };

  // This should only execute if there's a need to create a new database for the given IDB_VERSION.
  indexedDBOpenRequest.onupgradeneeded = function() {
    this.result.createObjectStore('instagramNotification', {keyPath: 'postId'});
    this.result.createObjectStore('inboxNotification', {keyPath: 'id'});
  };

  // This will execute each time the database is opened.
  indexedDBOpenRequest.onsuccess = function() {
    idbDatabase = this.result;
  };
}

// Helper method to get the object store that we care about.
function getObjectStore(storeName, mode) {
  return idbDatabase.transaction(storeName, mode).objectStore(storeName);
}


function saveIGData(igData) {
  console.log('called saveAnalyticsRequest', igData);
  getObjectStore('instagramNotification', 'readwrite').add(igData);
}

function saveInboxData(inboxData) {
  console.log('called saveInboxData', inboxData);
  getObjectStore('inboxNotification', 'readwrite').add(inboxData);
}

function saveData(data) {
  console.log('called saveData', data);
  if (!data) {return;}

  if (data.type === 'newInboxMessage') {
    data.id = (new Date()).getTime();
    saveInboxData(data);
  } else {
    saveIGData(data);
  }
}

openDatabase();

 // Initialize the Firebase app in the service worker by passing in the
 // messagingSenderId.
 firebase.initializeApp({
   'messagingSenderId': '161648463889'
 });

 // Retrieve an instance of Firebase Messaging so that it can handle background
 // messages.
 const messaging = firebase.messaging();

// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]

messaging.setBackgroundMessageHandler(function(payload) {
  // Customize notification here
  console.log('[firebase-messaging-sw.js] Received background message ' + JSON.stringify(payload));
  if( payload.data && payload.data.notification ) {
      var notification = JSON.parse(payload.data.notification);
      const notificationTitle = notification.title;
      const notificationOptions =  {
        body: notification.body,
        click_action: 'https://qa.app.eclincher.com/mobile',
        icon: "https://app.eclincher.com//img/logo-recurly-50.png",
        tag: notification.tag
      };    

      self.saveData(payload.data);
      
      return self.registration.showNotification(notificationTitle,
          notificationOptions);
  }
  
  return false;
 
});


self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received 111.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('https://qa.app.eclincher.com/mobile')
  );
});

   

// [END background_handler]
