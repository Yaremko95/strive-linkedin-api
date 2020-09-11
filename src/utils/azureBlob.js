require("dotenv").config();

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");
const credentials = new StorageSharedKeyCredential(
  "linkedinstrive",
  process.env.STORAGE_KEY
);
const blobClient = new BlobServiceClient(
  "https://linkedinstrive.blob.core.windows.net/",
  credentials
);

module.exports = uploadFile = async (containerName, user) => {
  let container = await blobClient.getContainerClient(containerName);
  const files = await container.listBlobsFlat();

  for await (const file of files) {
    let url = await container.getBlobClient(file.name).url;
    if (url === user.image) {
      const cont = await blobClient.getContainerClient("profile");
      await cont.deleteBlob(await cont.getBlobClient(file.name)._name);
    }
  }
};
