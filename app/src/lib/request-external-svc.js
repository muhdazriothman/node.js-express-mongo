'use strict';

const debug = require('debug')('lib:metadata');
const util = require('util');
const config = require('@newspage/lib-commons/config');
const ctx = require('@newspage/lib-commons/ctx');
const axios = require('axios');

let externalServiceConfig;

function initialize(svc, port) {
  const appInfo = config('VCAP_APPLICATION');
  const appInfoObj = appInfo ? JSON.parse(appInfo) : {};
  const space = appInfoObj['space_name'] ? appInfoObj['space_name'].toLowerCase() : 'dev';
  const isRemote = config(`NODE_ENV`) === 'production' || config('VCAP_SERVICES') ? true : false;
  // const isRemote = config(`NODE_ENV`) === 'dev' || config('VCAP_SERVICES') ? true : false;
  const host = isRemote ? `https://${svc}-${space}.cfapps.jp10.hana.ondemand.com` : `http://localhost:${port}`;
  // const host = isRemote ? `https://${svc}-${space}.cfapps.jp10.hana.ondemand.com` : `https://${svc}-${space}.cfapps.jp10.hana.ondemand.com`;
  let options = { host: host, version: '1.0' };
  externalServiceConfig = Object.assign(options);
  debug(`${svc} lib has been configured with host ${host}`);
}

const dynamicHie = {
  getActiveStructure: async (structureType) => {
    initialize('dynamic-hierarchy-svc', '5052');
    let url = `structure/active/${structureType}`;
    return await _handleRequest(url, 'GET', null);
  },
  getHier: async (hierId) => {
    initialize('dynamic-hierarchy-svc', '5052');
    let url = `structure/hier/${hierId}`;
    return await _handleRequest(url, 'GET', null);
  },
  getNodeByTreeId: async (hierId, treeId) => {
    initialize('dynamic-hierarchy-svc', '5052');
    let url = `hierarchy/hier/${hierId}/tree/${treeId}`;

    return await _handleRequest(url, 'GET', null);
  },
  // getCompleteParent: async (hierId, treeId) => {
  //   initialize('dynamic-hierarchy-svc','5052');
  //   let url = `hierarchy/hier/${hierId}/tree/${treeId}/grid`;
  //   return await _handleRequest(url, 'GET', null);
  // },
  // getLobList: async () => {
  //   initialize('dynamic-hierarchy-svc','5052');
  //   let url = `master/lob/list`;
  //   return await _handleRequest(url, 'GET', null);
  // },
  // getNodeParent: async (nodeId) => {
  //   initialize('dynamic-hierarchy-svc', '5052');
  //   let url = `hierarchy/node/${nodeId}/grid`;
  //   return await _handleRequest(url, 'GET', null);
  // },
  getNode: async (nodeId) => {
    initialize('dynamic-hierarchy-svc', '5052');
    let url = `hierarchy/node/${nodeId}`;
    return await _handleRequest(url, 'GET', null);
  },
  getTreeChildren: async (hierId, treeId) => {
    initialize('dynamic-hierarchy-svc', '5052');
    let url = `hierarchy/hier/${hierId}/tree/${treeId}/view`;
    return await _handleRequest(url, 'GET', null);
  },
  getDistributorGeoTree: async () => {
    initialize('profile-dist-svc', '5056');
    let url = `/distributor-geotree`;
    return await _handleRequest(url, 'GET', null);
  },

  // getCompleteParentRaw: async (hierId, treeId) => {
  //   initialize('dynamic-hierarchy-svc','5052');
  //   let url = `hierarchy/hier/${hierId}/tree/${treeId}/raw`;
  //   return await _handleRequest(url, 'GET', null);
  // }
};

const routeSvc = {
  getCommRoute: async () => {
    initialize('profile-route-svc', '5053');
    let url = `comm/route/`;
    return await _handleRequest(url, 'GET', null);
  }
};

async function _handleRequest(path, method, jsonData = null) {
  debug(`calling ${method} to external service ${path}`);
  try {
    let accessToken = ctx.getJwtToken();
    let localeInfo = ctx.getLocaleInfo();
    let locales = localeInfo && localeInfo.locales && localeInfo.locales.length > 0 ? localeInfo.locales.join(';') : 'en-US';
    let baseUrl = `${externalServiceConfig.host}/api/v${externalServiceConfig.version}/`;
    let options = {
      method: method,
      url: path,
      baseURL: baseUrl,
      timeout: 20000,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/plain, */*', 'Accept-Language': locales },
      responseType: 'json'
    };
    if (accessToken) {
      options.headers = { ...options.headers, Authorization: 'Bearer ' + accessToken };
    }
    if (jsonData) {
      options.data = jsonData;
    }
    debug(`calling external service ${path} with options ${util.inspect(options)}`);
    const result = await axios(options);
    return result.data;
  } catch (err) {
    debug(`Error when calling external service ${util.inspect(err.message)}`);
    if (err.response.data['code'] && err.response.data['code'].length > 0) {
      throw err.response.data;
    }
    throw err;
  }
}

module.exports = {
  dynamicHie: dynamicHie,
  routeSvc: routeSvc
};