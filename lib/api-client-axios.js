/* eslint-disable operator-linebreak */
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

const screenshotHeaders = {
  headers: {
    'Content-Type': 'image/png',
    'x-zbr-screenshot-captured-at': new Date().getTime(),
  },
};

const multipartDataHeaders = (boundary) => ({
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  },
});

const buildMultiPartStream = (jsonPart, filePart, boundary) => {
  const eol = '\r\n';
  const bx = `--${boundary}`;
  const buffers = [
    Buffer.from(
      // eslint-disable-next-line prefer-template
      bx +
        eol +
        'Content-Disposition: form-data; name="json_request_part"' +
        eol +
        'Content-Type: application/json' +
        eol +
        eol +
        eol +
        JSON.stringify(jsonPart) +
        eol,
    ),
    Buffer.from(
      // eslint-disable-next-line prefer-template
      bx +
        eol +
        'Content-Disposition: form-data; name="file"; filename="' +
        filePart.name +
        '"' +
        eol +
        'Content-Type: ' +
        filePart.type +
        eol +
        eol,
    ),
    Buffer.from(filePart.content, 'base64'),
    Buffer.from(`${eol + bx}--${eol}`),
  ];

  return Buffer.concat(buffers);
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
    }
  }

  async callPatch(url, body, headers) {
    try {
      const config = {
        headers,
      };
      const patchPromise = await this.axiosClient.patch(url, body, config);

      return patchPromise;
    } catch (error) {
      console.log('PATCH Error', error);
    }
  }

  async callDelete(url, headers) {
    try {
      const config = {
        headers,
      };

      const deletePromise = await this.axiosClient.delete(url, config);

      return deletePromise;
    } catch (error) {
      console.log('DELETE Error', error);
    }
  }
}

module.exports = {
  HttpClient,
  jsonHeaders,
  imageHeaders,
  screenshotHeaders,
  multipartDataHeaders,
  buildMultiPartStream,
};
