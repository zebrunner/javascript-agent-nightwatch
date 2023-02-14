const getValueByPath = (object, path) => path.split('.').reduce((o, k) => o?.[k], object);

class ConfigResolver {
  constructor(reporterConfig) {
    this.reporterConfig = reporterConfig;
  }

  getConfig(envVarName, configName, defaultValue) {
    if (process.env[envVarName]) {
      return process.env[envVarName];
    }
    const configValue = getValueByPath(
      this.reporterConfig.reporterOptions.zebrunnerConfig,
      configName,
    );

    if (configValue) {
      return configValue;
    }

    return defaultValue;
  }

  isReportingEnabled() {
    if (
      this.getReportingEnabled() === true
      && (!this.getReportingServerHostname() || !this.getReportingServerAccessToken())
    ) {
      throw new Error(
        'When reporting is enabled, you must provide Zebrunner hostname and accessToken',
      );
    }

    return this.getReportingEnabled();
  }

  getReportingEnabled() {
    return String(this.getConfig('REPORTING_ENABLED', 'enabled')).toLowerCase() === 'true';
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
