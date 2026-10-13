using System;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace BGB2
{
    /// <summary>The always-visible left category binder. All six buttons share one size (the selected one is not bigger).</summary>
    public class CategoryPanel : MonoBehaviour
    {
        public List<Button> buttons = new List<Button>();
        public List<Image> backgrounds = new List<Image>();
        public List<TMP_Text> labels = new List<TMP_Text>();
        public Sprite normal, selected;
        public Action<int> onSelect;

        void Awake()
        {
            for (int i = 0; i < buttons.Count; i++) { int c = i; buttons[i].onClick.AddListener(() => onSelect?.Invoke(c)); }
        }

        void OnEnable() { Loc.Changed += Relabel; Relabel(); }
        void OnDisable() { Loc.Changed -= Relabel; }

        void Relabel()
        {
            var names = Loc.Current == Language.Korean ? CaseFileView.TabsKo : CaseFileView.TabsEn;
            for (int i = 0; i < labels.Count && i < names.Length; i++) labels[i].text = names[i];
        }

        public void SetSelected(int index)
        {
            for (int i = 0; i < backgrounds.Count; i++)
            {
                backgrounds[i].sprite = i == index ? selected : normal;
                labels[i].color = i == index ? new Color(0.96f, 0.89f, 0.75f) : new Color(0.23f, 0.16f, 0.11f);
            }
        }
    }
}
