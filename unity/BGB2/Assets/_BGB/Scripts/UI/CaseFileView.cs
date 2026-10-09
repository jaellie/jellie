using System.Collections.Generic;
using System.Text;
using TMPro;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

namespace BGB2
{
    /// <summary>Case File overlay. Investigate, Evidence and Notes are implemented; People, Timeline and Map are stubs
    /// until their systems are built (listed honestly in IMPLEMENTATION_STATUS.md).</summary>
    public class CaseFileView : MonoBehaviour
    {
        public GameObject root;
        public TMP_Text heading, pageBody;
        public Image detailIcon;
        public List<EvidenceDefinition> allEvidence = new List<EvidenceDefinition>();
        public CategoryPanel categories;

        public static readonly string[] TabsEn = { "Investigate", "People", "Evidence", "Timeline", "Notes", "Map" };
        public static readonly string[] TabsKo = { "조사", "인물", "증거", "타임라인", "노트", "지도" };

        int tab;
        public bool IsOpen => root.activeSelf;

        void OnEnable() { Loc.Changed += Refresh; Game.EvidenceChanged += Refresh; }
        void OnDisable() { Loc.Changed -= Refresh; Game.EvidenceChanged -= Refresh; }

        public void Open(int tabIndex)
        {
            tab = Mathf.Clamp(tabIndex, 0, 5);
            root.SetActive(true);
            PlayerController.InputLocked = true;
            Refresh();
        }

        public void Close() { root.SetActive(false); PlayerController.InputLocked = false; }

        public void Toggle() { if (IsOpen) Close(); else Open(tab); }

        void Update()
        {
            var kb = Keyboard.current;
            if (kb == null) return;
            if (kb.tabKey.wasPressedThisFrame) { if (IsOpen || !PlayerController.InputLocked) Toggle(); }
            if (kb.escapeKey.wasPressedThisFrame && IsOpen) Close();
        }

        public void Refresh()
        {
            if (!IsOpen) return;
            heading.text = (Loc.Current == Language.Korean ? TabsKo : TabsEn)[tab];
            var sb = new StringBuilder();
            bool ko = Loc.Current == Language.Korean;
            switch (tab)
            {
                case 0:
                    sb.AppendLine(ko ? "에드워드의 죽음" : "The Death of Edward");
                    sb.AppendLine();
                    Line(sb, Game.State.HasFlag("nini.done"), ko ? "니니와 이야기하기" : "Talk to Nini");
                    Line(sb, Game.State.HasEvidence("notice"), ko ? "표지판 읽기" : "Read the signpost");
                    Line(sb, Game.State.HasEvidence("clock"), ko ? "탑시계 올려다보기" : "Look up at the tower clock");
                    Line(sb, Game.State.HasFlag("oliver.bear"), ko ? "시계지기와 이야기하기" : "Talk to the Clockkeeper");
                    break;
                case 2:
                    if (Game.State.evidence.Count == 0) sb.AppendLine(ko ? "아직 아무것도 없다." : "Nothing here yet.");
                    foreach (var def in allEvidence)
                        if (Game.State.HasEvidence(def.id)) { sb.AppendLine("<b>" + def.displayName.Get() + "</b>"); sb.AppendLine(def.Description); sb.AppendLine(); }
                    break;
                case 4:
                    foreach (var def in allEvidence)
                        if (Game.State.notes.Contains(def.id) && def.note != null) sb.AppendLine("• " + def.note.Get());
                    if (sb.Length == 0) sb.AppendLine(ko ? "아직 아무것도 없다." : "Nothing here yet.");
                    break;
                default:
                    sb.AppendLine(ko ? "이 페이지는 아직 만들어지지 않았다." : "This page is not built yet.");
                    break;
            }
            pageBody.text = sb.ToString();
            if (categories != null) categories.SetSelected(tab);
        }

        static void Line(StringBuilder sb, bool done, string text) => sb.AppendLine((done ? "☑ " : "☐ ") + text);
    }
}
