const assert = require("assert");
const fs = require("fs");
const path = require("path");

const matrix = fs.readFileSync(path.resolve(__dirname, "..", "matrix.html"), "utf8");

const singleActive = matrix.match(/function installSingleActiveWeaponSections\(\) \{([\s\S]*?)\n\}/);
assert(singleActive, "single-active Weapon Setup controller exists");
assert(singleActive[1].includes('details.secondary-profile-section'), "only Weapon Setup sections participate");
assert(singleActive[1].includes("other !== section && other.open"), "opening a section identifies previously open sections");
assert(singleActive[1].includes("other.open = false"), "previously open section closes");
assert(!/clearSetupFields|save|collectForm|setForm/.test(singleActive[1]), "section arbitration does not clear, save, or rebuild form data");
assert(matrix.includes("installSingleActiveWeaponSections();"), "single-active controller is installed");

const focusOrder = [
  ['opticType: value === "Other" ? "customOpticType" : "opticBrand"', "Optic Type advances to Manufacturer"],
  ['opticBrand: value === "Other" ? "customOpticManufacturer" : "opticModel"', "Manufacturer advances to Model"],
  ['opticModel: value === "Other" ? "customOpticModel" : "magnification"', "Model advances to Magnification"],
  ['magnification: value === "Other" ? "customMagnification" : "opticClickValue"', "Magnification advances to Click Value"],
  ['opticClickValue: value === "Custom" ? "customOpticClickValue" : "opticAdjustmentUnit"', "Click Value advances to Units"]
];
focusOrder.forEach(([source, label]) => assert(matrix.includes(source), label));
assert(matrix.includes("field.focus({ preventScroll: true })"), "focus progression does not scroll the page");

const opticMarkup = matrix.slice(matrix.indexOf('<summary>Optic Details</summary>'), matrix.indexOf('<summary>Ammo Details</summary>'));
const orderedIds = ["opticType", "opticBrand", "opticModel", "magnification", "opticClickValue", "opticAdjustmentUnit"];
for (let index = 1; index < orderedIds.length; index += 1) {
  assert(opticMarkup.indexOf(`id="${orderedIds[index - 1]}"`) < opticMarkup.indexOf(`id="${orderedIds[index]}"`), `${orderedIds[index - 1]} precedes ${orderedIds[index]}`);
}

assert(matrix.includes("function collectForm()"), "existing save collection remains present");
assert(matrix.includes("data[field.name] = field.value.trim()"), "save still collects every named form field");
assert(matrix.includes('document.getElementById("opticAdjustmentUnit").value = "MOA";'), "new setup retains the governed default optic unit");
console.log("PASS Weapon Setup Product Polish governance");
