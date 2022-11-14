const endpoints = {
  docStorage: window.axios.create({
    baseURL: 'https://nm-test-apps.firebaseio.com/',
  }),
};

endpoints.docStorage.defaults.headers.post['Content-Type'] = 'application/json';

module.exports = endpoints;
