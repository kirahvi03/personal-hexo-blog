(function () {
  'use strict';
  var DB_NAME = 'ssy-personal-archive';
  var DB_VERSION = 1;
  var STORE = 'items';

  function requestAsPromise(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function openDatabase() {
    if (!window.indexedDB) return Promise.reject(new Error('IndexedDB unavailable'));
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function transaction(mode, callback) {
    return window.PersonalArchiveStore.ready.then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, mode);
        var result;
        try { result = callback(tx.objectStore(STORE)); } catch (error) { reject(error); return; }
        tx.oncomplete = function () { resolve(result); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error || new Error('Archive transaction aborted')); };
      });
    });
  }

  window.PersonalArchiveStore = {
    ready: openDatabase(),
    getAll: function (type) {
      return transaction('readonly', function (store) {
        return requestAsPromise(store.getAll()).then(function (items) {
          return items.filter(function (item) { return !type || item.type === type; }).sort(function (a, b) { return b.createdAt - a.createdAt; });
        });
      });
    },
    put: function (item) { return transaction('readwrite', function (store) { store.put(item); }); },
    remove: function (id) { return transaction('readwrite', function (store) { store.delete(id); }); }
  };
}());
