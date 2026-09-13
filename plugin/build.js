import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const luaPath = path.join(__dirname, 'reuploader.lua');
const rbxmxPath = path.join(__dirname, 'reuploader.rbxmx');

try {
  const luaCode = fs.readFileSync(luaPath, 'utf8');
  const escapedCode = luaCode.replace(/]]>/g, ']]]\x3E<![CDATA[');

  const xmlContent = `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
	<Meta name="ExplicitIds">true</Meta>
	<External>null</External>
	<External>nil</External>
	<Item class="Script" Referent="RBX1432E6A1E14B42E7A0C383F6CC737A47">
		<Properties>
			<BinaryString name="AttributesSerialize"></BinaryString>
			<string name="Name">reuploader</string>
			<ProtectedString name="Source"><![CDATA[${escapedCode}]]></ProtectedString>
			<int64 name="SourceAssetId">-1</int64>
			<BinaryString name="Tags"></BinaryString>
		</Properties>
	</Item>
</roblox>`;

  fs.writeFileSync(rbxmxPath, xmlContent, 'utf8');
  console.log('Successfully compiled reuploader.lua to reuploader.rbxmx!');
} catch (err) {
  console.error('Failed to compile reuploader.lua:', err.message);
  process.exit(1);
}
