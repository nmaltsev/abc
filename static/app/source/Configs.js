function storageAvailable(type) {
  try {
    var storage = window[type],
    x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch(e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage.length !== 0;
  }
}

module.exports = {
  LOCALSTORAGE_AVAILABLE: storageAvailable('localStorage'),
  DEBUG: {
    keyCodes: false,
  },
  isFirefox: typeof(InstallTrigger) !== 'undefined',
  isIE11: !!window.MSInputMethodContext && !!document.documentMode, // This feature does not work in IE11
};
