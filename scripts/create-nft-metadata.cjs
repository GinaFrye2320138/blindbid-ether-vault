/**
 * NFT Metadata Generator
 *
 * 生成标准的 NFT 元数据 JSON 文件
 *
 * 使用方法:
 *   node scripts/create-nft-metadata.js
 */

const fs = require('fs');
const path = require('path');

// NFT 元数据模板
const metadata = {
  name: "BlindBid Auction Item #1",
  description: "A unique digital collectible available through BlindBid encrypted auction platform. This item features secure, private bidding using Fully Homomorphic Encryption (FHE).",

  // 图片 URI - 替换为你的实际图片链接
  // 可以是 IPFS, HTTP, 或 Arweave 链接
  image: "ipfs://QmExample123/artwork.png",

  // 外部链接（可选）
  external_url: "https://blindbid.example.com/item/1",

  // 属性列表
  attributes: [
    {
      trait_type: "Category",
      value: "Digital Art"
    },
    {
      trait_type: "Rarity",
      value: "Rare"
    },
    {
      trait_type: "Artist",
      value: "Anonymous Creator"
    },
    {
      trait_type: "Year",
      value: "2025"
    },
    {
      display_type: "number",
      trait_type: "Edition",
      value: 1
    }
  ],

  // 版权信息（可选）
  properties: {
    copyright: "© 2025 BlindBid",
    license: "CC BY-NC 4.0"
  }
};

// 创建 metadata 目录
const metadataDir = path.join(__dirname, '..', 'metadata');
if (!fs.existsSync(metadataDir)) {
  fs.mkdirSync(metadataDir, { recursive: true });
}

// 保存元数据文件
const filePath = path.join(metadataDir, 'nft-metadata.json');
fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));

console.log('✅ NFT 元数据已创建！');
console.log(`📁 文件位置: ${filePath}`);
console.log('\n📋 元数据内容:');
console.log(JSON.stringify(metadata, null, 2));
console.log('\n🚀 下一步:');
console.log('1. 如果需要，编辑 metadata/nft-metadata.json 文件');
console.log('2. 上传到 IPFS:');
console.log('   - 访问 https://pinata.cloud');
console.log('   - 注册并上传 nft-metadata.json');
console.log('   - 获得 IPFS hash');
console.log('   - 使用 ipfs://YOUR_HASH/nft-metadata.json 作为 Metadata URI');
console.log('\n或者使用 HTTP 链接进行测试:');
console.log('   - 上传到任何 Web 服务器');
console.log('   - 使用 https://your-domain.com/metadata.json');
