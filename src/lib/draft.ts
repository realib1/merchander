export async function saveFilesToDraft(key: string, files: File[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('merchander-drafts', 1);
    
    request.onupgradeneeded = (e: Event) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    
    request.onsuccess = (e: Event) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      store.put(files, key);
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function getFilesFromDraft(key: string): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('merchander-drafts', 1);
    
    request.onupgradeneeded = (e: Event) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    
    request.onsuccess = (e: Event) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('files')) return resolve([]);
      
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const getReq = store.get(key);
      
      getReq.onsuccess = () => resolve(getReq.result || []);
      getReq.onerror = () => reject(getReq.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function clearFilesFromDraft(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('merchander-drafts', 1);
    
    request.onupgradeneeded = (e: Event) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    
    request.onsuccess = (e: Event) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('files')) return resolve();
      
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      store.delete(key);
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}
