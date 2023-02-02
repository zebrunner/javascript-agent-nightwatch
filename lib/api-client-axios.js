const axios = require('axios');

const jsonHeaders = {
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

const imageHeaders = {
  headers: {
    'Content-Type': 'image/png',
  },
};

const multipartDataHeaders = {
  headers: {
    Accept: '*/*',
  },
};

class HttpClient {
  constructor(configResolver) {
    this.configResolver = configResolver;
    this.baseUrl = configResolver.getReportingServerHostname();
    // set config defaults when creating the instance
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      headers: {},
    });
  }

  async callGet(url, headers) {
    try {
      const config = {
        headers,
      };

      const getPromise = await this.axiosClient.get(url, config);

      return getPromise;
    } catch (error) {
      console.log('GET Error', error);
    }
  }

  async callPost(url, body, headers) {
    try {
      const config = {
        headers,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      };

      const postPromise = await this.axiosClient.post(url, body, config);

      return postPromise;
    } catch (error) {
      console.log('POST Error', error);
    }
  }

  async callPut(url, body, headers) {
    try {
      const config = {
        headers,
      };
      const putPromise = await this.axiosClient.put(url, body, config);

      return putPromise;
    } catch (error) {
      console.log('PUT Error', error);
      // reject(error)
    }
  }

  async callDelete(url, headers) {
    try {
      const config = {
        headers,
      };

      const getPromise = await this.axiosClient.delete(url, config);

      return getPromise;
    } catch (error) {
      console.log('DELETE Error', error);
    }
  }
}

module.exports = {
  HttpClient,
  jsonHeaders,
  imageHeaders,
  multipartDataHeaders,
};
