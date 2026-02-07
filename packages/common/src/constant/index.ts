import rootPackageJson from "../../../../package.json" with { type: "json" };

/**
 * Github 仓库地址
 */
export const GithubRepo = {
  owner: rootPackageJson.repository.owner,
  repo: rootPackageJson.repository.repo,
};
