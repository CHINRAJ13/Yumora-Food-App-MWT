import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './models/Restaurant.js';

dotenv.config();

// Unique image for every single restaurant
const imageMap = {
  "1":  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
  "2":  "https://images.unsplash.com/photo-1604908554007-3f0f7dcd9a1c?w=600&h=400&fit=crop",
  "3":  "https://images.unsplash.com/photo-1589187157353-67852afaf131?w=600&h=400&fit=crop",
  "4":  "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&h=400&fit=crop",
  "5":  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
  "6":  "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=600&h=400&fit=crop",
  "7":  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&h=400&fit=crop",
  "8":  "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop",
  "9":  "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=600&h=400&fit=crop",
  "10": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
  "11": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&h=400&fit=crop",
  "12": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=400&fit=crop",
  "13": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&h=400&fit=crop",
  "14": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&h=400&fit=crop",
  "15": "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=600&h=400&fit=crop",
  "16": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop",
  "17": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&h=400&fit=crop",
  "18": "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop",
  "19": "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop",
  "20": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop",
  "21": "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&h=400&fit=crop",
  "22": "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=400&fit=crop",
  "23": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&h=400&fit=crop",
  "24": "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop",
  "25": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
  "26": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&h=400&fit=crop",
  "27": "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&h=400&fit=crop",
  "28": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&h=400&fit=crop",
  "29": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
  "30": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop",
  "31": "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&h=400&fit=crop",
  "32": "https://images.unsplash.com/photo-1551183053-bf91798d702f?w=600&h=400&fit=crop",
  "33": "https://images.unsplash.com/photo-1445294211564-3ca59d999abd?w=600&h=400&fit=crop",
  "34": "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=400&fit=crop",
  "35": "https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?w=600&h=400&fit=crop",
  "36": "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&h=400&fit=crop",
  "37": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop",
  "38": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop",
  "39": "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&h=400&fit=crop",
  "40": "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?w=600&h=400&fit=crop",
  "41": "https://images.unsplash.com/photo-1565957959676-0d2a08fde6c0?w=600&h=400&fit=crop",
  "42": "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&h=400&fit=crop",
  "43": "https://images.unsplash.com/photo-1567428029-23bbc311b91f?w=600&h=400&fit=crop",
  "44": "https://images.unsplash.com/photo-1532980400857-e8d9d275d858?w=600&h=400&fit=crop",
  "45": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=400&fit=crop",
  "46": "https://images.unsplash.com/photo-1504544750208-d0a000efce85?w=600&h=400&fit=crop",
  "47": "https://images.unsplash.com/photo-1458642849426-cfb724f15ef7?w=600&h=400&fit=crop",
  "48": "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=600&h=400&fit=crop",
  "49": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
  "50": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop",
  "51": "https://images.unsplash.com/photo-1560624052-449f5ddf0c31?w=600&h=400&fit=crop",
  "52": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&h=400&fit=crop",
  "53": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&h=400&fit=crop",
  "54": "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=600&h=400&fit=crop",
  "55": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop",
  "56": "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&h=400&fit=crop",
  "57": "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=400&fit=crop",
  "58": "https://images.unsplash.com/photo-1549590143-d5855148a9d5?w=600&h=400&fit=crop",
  "59": "https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=600&h=400&fit=crop",
  "60": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=400&fit=crop",
};

async function updateImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let updated = 0;
    for (const [id, image] of Object.entries(imageMap)) {
      const result = await Restaurant.updateOne({ id }, { $set: { image } });
      if (result.matchedCount > 0) {
        updated++;
        console.log(`  ✅ ${id} updated`);
      } else {
        console.log(`  ⚠️  ${id} not found`);
      }
    }

    console.log(`\n✅ Updated ${updated} restaurant images`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateImages();
