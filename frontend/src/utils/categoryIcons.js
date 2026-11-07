const RULES = [
  ["laptop", "fa-laptop"],
  ["tablet", "fa-tablet-screen-button"],
  ["phone", "fa-mobile-screen"],
  ["television", "fa-tv"],
  ["tv", "fa-tv"],
  ["headphone", "fa-headphones"],
  ["audio", "fa-headphones"],
  ["camera", "fa-camera"],
  ["photo", "fa-camera"],
  ["game", "fa-gamepad"],
  ["watch", "fa-clock"],
  ["sunglass", "fa-glasses"],
  ["shoe", "fa-shoe-prints"],
  ["bag", "fa-bag-shopping"],
  ["jewel", "fa-gem"],
  ["shirt", "fa-shirt"],
  ["dress", "fa-shirt"],
  ["cloth", "fa-shirt"],
  ["top", "fa-shirt"],
  ["fragrance", "fa-spray-can-sparkles"],
  ["beauty", "fa-wand-magic-sparkles"],
  ["skin", "fa-pump-soap"],
  ["grocer", "fa-basket-shopping"],
  ["furniture", "fa-couch"],
  ["kitchen", "fa-utensils"],
  ["home", "fa-house"],
  ["sport", "fa-dumbbell"],
  ["motorcycle", "fa-motorcycle"],
  ["vehicle", "fa-car"],
  ["car", "fa-car"]
];

export function getCategoryIcon(slug) {
  const value = String(slug || "").toLowerCase();
  const match = RULES.find(([key]) => value.includes(key));
  return match ? match[1] : "fa-tag";
}
