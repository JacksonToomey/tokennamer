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
    const role = await OBR.player.getRole();
    if (role !== "GM") return;
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
      if (tokens.length < 1) return;
      OBR.scene.items.updateItems(
        tokens.map((t) => t.id),
        (items) => {
          console.log("updating item");
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
