const Typesense = require('typesense');
require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('./food-shopping-app-23a32-firebase-adminsdk-11hrj-684560a62e.json');
const { EATERIES_COLLECTION_NAME } = process.env;

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST, // where xxx is the ClusterID of your Typesense Cloud cluster
      port: '8108',
      protocol: 'http',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY,
  connectionTimeoutSeconds: 2,
});

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

let eaterySchema = {
  name: EATERIES_COLLECTION_NAME,
  fields: [
    { name: 'name', type: 'string' },
    { name: 'id', type: 'string' },
    { name: 'products', type: 'string[]' },
  ],
};

client.health
  .retrieve()
  .then((res) => {
    console.log('OK');
  })
  .then(() => {
    app
      .firestore()
      .collection(EATERIES_COLLECTION_NAME)
      .onSnapshot((snapshot) => {
        const eateries = [];
        snapshot.forEach((doc) => {
          const eatery = { name: doc.data().name, id: doc.id, products: [] };
          doc.ref.collection('products').onSnapshot((productSnapshot) => {
            const products = [];
            productSnapshot.forEach((prodDoc) => {
              const product = prodDoc.data().name || prodDoc.id;
              products.push(product);
            });
            client
              .collections('eateries')
              .documents()
              .upsert({ name: eatery.name, id: eatery.id, products });
          });
          eateries.push(eatery);
        });
        return client
          .collections()
          .retrieve()
          .then((collections) => {
            const collection = collections.find(
              (collection) => (collection.name = EATERIES_COLLECTION_NAME)
            );
            if (collection) {
              return client.collections(EATERIES_COLLECTION_NAME).delete();
            } else {
              return;
            }
          })
          .then(() => {
            return client.collections().create(eaterySchema);
          })
          .then(() => {
            client
              .collections(EATERIES_COLLECTION_NAME)
              .documents()
              .import(eateries, { action: 'upsert' });
          });
      });
  });
