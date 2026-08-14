/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

// This site deploys as the <username>.github.io ROOT page, so basePath/assetPrefix are
// left empty. If it ever moves to a project page (e.g. https://<username>.github.io/<repo>/),
// set BOTH `basePath` and `assetPrefix` to "/<repo>" so routes and asset paths resolve
// correctly under the subpath.
export default nextConfig;
