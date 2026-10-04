/*
 * main.js — boots the game once every engine and content script has loaded.
 */
(function () {
  "use strict";
  var BGB = globalThis.BGB;
  document.addEventListener("DOMContentLoaded", function () {
    var settings = BGB.save.loadSettings();
    var meta = BGB.save.loadMeta();
    var game = new BGB.Game(BGB.story, meta);
    BGB.app.init(game, settings, meta);
  });
})();
