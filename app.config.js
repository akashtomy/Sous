// Adds deploy-time settings on top of app.json.
// SOUS_BASE_PATH serves the web build from a sub-path, e.g. "/Sous" for GitHub Pages
// (https://<user>.github.io/Sous/). Unset for local development and root-domain hosting.
module.exports = ({ config }) => {
  const basePath = process.env.SOUS_BASE_PATH;
  if (!basePath) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl: basePath } };
};
