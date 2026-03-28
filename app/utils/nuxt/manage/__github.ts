import axios from "axios";
import { translate } from "../i18n";
import { getCurrentTab, devHotListen } from "../utils";
import { createDiffModal } from ".";
import type { CommitParams, CommitParamsAddition, CommonItem } from "~/utils/common/types";
import { notify } from "~/utils/nuxt/notify";
import { rebuildEvent } from "~~/vite-plugins/types";
import { useGithubToken, useRemoteLatestSha } from "~/composables/states";
import config from "~~/config";

export async function isAuthor(token: string): Promise<boolean> {
  const apiUrl = config.githubApiUrl || "https://api.github.com";
  const result = await axios.post(
    `${apiUrl}/graphql`,
    {
      query: `query {
        viewer {
          login
        }
        repository(name: "${__NB_GITHUB_REPO__}", owner: "${config.githubName}") {
          ref(qualifiedName: "${useRuntimeConfig().app.githubBranch}") {
            target {
              ... on Commit {
                history(first: 1) {
                  nodes {
                    oid
                  }
                }
              }
            }
          }
        }
      }`
    },
    {
      headers: {
        Authorization: "token " + token
      }
    }
  );

  const err = result.data.errors;
  if (err) {
    throw new Error(err);
  } else {
    const verified = result.data.data.viewer.login === config.githubName;
    if (verified) {
      // token 验证成功
      useGithubToken().value = token;
      // 更新 commit id
      useRemoteLatestSha().value = result.data.data.repository.ref.target.history.nodes[0].oid;
    }
    return verified;
  }
}

export async function createCommit(
  _commit = "",
  { additions, deletions }: CommitParams
): Promise<boolean> {
  // 显示 diff 弹窗让用户确认更改
  if (!(await createDiffModal({ additions, deletions }))) {
    return false;
  }
  import.meta.hot!.send(rebuildEvent, {
    additions,
    deletions
  });
  return listenServer();
}

export async function deleteList(
  newList: CommonItem[],
  dels: { item: CommonItem; md: string }[]
): Promise<boolean> {
  const folder = getCurrentTab();
  return createCommit(
    `Delete ${dels.length} items from ${folder}`,
    {
      additions: [{
        path: `public/rebuild/json${folder}.json`,
        content: JSON.stringify(newList)
      }],
      deletions: dels.map(item => ({
        path: `public/rebuild${folder}/${item.item.id}.md`,
        content: item.md
      }))
    }
  );
}

export async function commitStagedItems(
  additions: CommitParamsAddition[]
): Promise<boolean> {
  if (additions.length === 0) {
    return true;
  }

  const commitMessage = `Batch update ${additions.length} items`;
  return createCommit(commitMessage, { additions });
}

function listenServer(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    devHotListen(rebuildEvent, (data) => {
      if (typeof data === "boolean") {
        resolve(data);
        if (data) {
          notify({
            title: translate("update-success"),
            description: translate("refresh-after-sec", [1])
          });
          setTimeout(() => {
            location.reload();
          }, 1000);
        }
      } else {
        reject(data);
      }
    });
  });
}
