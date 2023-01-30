class ConfigResolver {

  constructor(reporterConfig) {
    this.reporterConfig = reporterConfig;
  }

  getConfig(envVarName, configName, defaultValue) {
    if (process.env[envVarName]) {
      console.log(`Env variable ${envVarName} has value = ${process.env[envVarName]}`);
      return process.env[envVarName];
    }
    const configValue = this.getValueByPath(this.reporterConfig.reporterOptions.zebrunnerConfig, configName);
    if (configValue) {
      console.log(`Config name ${configName} has value ${configValue}`);
      return configValue;
    }
    return defaultValue;
  }

  getValueByPath = (object, path) => path.split('.').reduce((o, k) => o?.[k], object);

  isConfigurationValid() {
    if (this.getReportingEnabled() === true && (!this.getReportingServerHostname() || !this.getReportingServerAccessToken())) {
      throw new Error('When reporting is enabled, you must provide Zebrunner hostname and accessToken');
    }
  }

  getReportingEnabled() {
    return this.getConfig('REPORTING_ENABLED', 'enabled');
  }

  getReportingServerHostname() {
    return this.getConfig('REPORTING_SERVER_HOSTNAME', 'server.hostname');
  }

  getReportingServerAccessToken() {
    return this.getConfig('REPORTING_SERVER_ACCESS_TOKEN', 'server.accessToken');
  }

  getReportingProjectKey() {
    return this.getConfig('REPORTING_PROJECT_KEY', 'projectKey', 'DEF');
  }

  getReportingRunDisplayName() {
    return this.getConfig('REPORTING_RUN_DISPLAY_NAME', 'run.displayName', 'Default Suite');
  }

  getReportingRunBuild() {
    return this.getConfig('REPORTING_RUN_BUILD', 'run.build');
  }

  getReportingRunEnvironment() {
    return this.getConfig('REPORTING_RUN_ENVIRONMENT', 'run.environment');
  }

  getReportingRunLocale() {
    return this.getConfig('REPORTING_RUN_LOCALE', 'run.locale');
  }

}

module.exports = ConfigResolver;
