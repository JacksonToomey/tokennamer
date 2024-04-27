import OBR, { Item } from "@owlbear-rodeo/sdk";

const METADATA_PREFIX = "jt-tokennamer";

type ItemMetadata = {
  tokenName?: string;
};

type SceneMetadata = {
  groups?: Record<string, number>;
};

const getItemMetadata = (item: Item) => {
  return (item.metadata[METADATA_PREFIX] || {}) as ItemMetadata;
};

const setItemMetadata = (item: Item, update: ItemMetadata) => {
  const meta = getItemMetadata(item);
  item.metadata = {
    ...item.metadata,
    [METADATA_PREFIX]: update,
  };
};

const getSceneMetadata = async () => {
  const sceneMeta = await OBR.scene.getMetadata();
  return (sceneMeta[METADATA_PREFIX] as SceneMetadata) || ({} as SceneMetadata);
};

const setSceneMetadata = async (meta: SceneMetadata) => {
  const existing = await OBR.scene.getMetadata();
  const updated = {
    ...existing,
    [METADATA_PREFIX]: meta,
  };
  await OBR.scene.setMetadata(updated);
};

const isToken = (item: Item) => {
  if (item.layer !== "CHARACTER") return false;
  if (item.type !== "IMAGE") return false;
  return true;
};

OBR.onReady(async () => {
  OBR.scene.onReadyChange(async (ready) => {
    if (!ready) return;
    OBR.scene.items.onChange(async (items) => {
      const tokens = items.filter(isToken).filter((item) => {
        const meta = getItemMetadata(item);
        return !meta.tokenName;
      });
      const sceneMeta = await getSceneMetadata();
      const groups = sceneMeta.groups || {};
      const names: Record<string, string> = {};
      for (const token of tokens) {
        const count = groups[token.name] || 0;
        const newCount = count + 1;
        names[token.id] = `${token.name} ${newCount === 1 ? "" : newCount}`;
        groups[token.name] = newCount;
      }
      OBR.scene.items.updateItems(
        tokens.map((t) => t.id),
        (items) => {
          for (let item of items) {
            const meta = getItemMetadata(item);
            const name = names[item.id];
            setItemMetadata(item, { ...meta, tokenName: name });
            item.text.plainText = name;
          }
        }
      );
      setSceneMetadata({
        groups,
      });
    });
  });
});
//     await OBR.scene.items.updateItems(tokens, async (tokensToUpdate) => {
//       // const sceneMeta = await getSceneMetadata();
//       // const groups = sceneMeta.groups || {};
//       const groups: Record<string, number> = {};
//       console.log(tokensToUpdate);
//       for (let token of tokensToUpdate) {
//         // const count = groups[token.name] || 0;
//         // token.text.plainText = `${token.name} ${count + 1}`;
//         token.text.plainText = "foo";
//         // groups[token.name] = count + 1;
//       }
//       console.log(groups);
//       // const groups = tokensToUpdate.reduce((acc, token) => {
//       //   const count = acc[token.name] || 0;
//       //   token.text.plainText = `${token.name} ${count + 1}`;
//       //   return {
//       //     ...acc,
//       //     [token.name]: count + 1,
//       //   };
//       // }, sceneMeta.groups || {});
//       // console.log(groups);
//     });
//   });
// });
// OBR.scene.items.onChange((items) => {
//   const tokens = items
//     .filter((i) => i.layer === "CHARACTER")
//     .filter((i) => i.type === "IMAGE")
//     .filter((i) => {
//       const meta = getItemMetadata(i);
//       return !meta.tokenName;
//     });
//   setTimeout(async () => {
//     OBR.scene.items.updateItems(tokens, async (itemsToUpdate) => {
//       for (const item of itemsToUpdate) {
//         item.text.plainText = "foo";
//       }
//     });
//   }, 10);
// OBR.scene.items.updateItems(
//   tokens.map((t) => t.id),
//   async (itemsToUpdate) => {
//     for (const item of itemsToUpdate) {
//       item.text.plainText = "foo";
//     }
//     // const sceneMeta = await getSceneMetadata();
//     // const groups = itemsToUpdate.reduce((acc, item) => {
//     //   const currentCount = acc[item.name] || 0;
//     //   item.text.plainText = `${item.name} ${currentCount + 1}`;
//     //   setItemMetadata(item, { tokenName: item.text.plainText });
//     //   return {
//     //     ...acc,
//     //     [item.name]: currentCount + 1,
//     //   };
//     // }, sceneMeta.groups || {});
//     // console.log(groups);
//     // await setMetadata({ ...sceneMeta, groups: {} });
//   }
// );
// });
// });
