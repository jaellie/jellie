using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

namespace BGB2
{
    /// <summary>Typewriter dialogue with portrait, name ribbon and centred, text-fitted choices.</summary>
    public class DialogueView : MonoBehaviour
    {
        public GameObject root;
        public RectTransform box;                  // nine-sliced dialogue box, centred horizontally
        public Image portrait;
        public TMP_Text speakerName, body;
        public RectTransform choiceHost;           // vertical layout, centred
        public Button choiceTemplate;              // disabled prototype
        public float charsPerSecond = 45f;
        public List<Speaker> speakers = new List<Speaker>();

        DialogueDefinition def;
        int index = -1;
        Coroutine typing;
        string fullText;
        readonly List<Button> choiceButtons = new List<Button>();
        int selected;

        public bool IsOpen => root != null && root.activeSelf;

        public void Play(DialogueDefinition d)
        {
            def = d;
            root.SetActive(true);
            PlayerController.InputLocked = true;
            ShowNode(0);
        }

        void ShowNode(int i)
        {
            if (def == null || i < 0 || i >= def.nodes.Length) { Close(); return; }
            index = i;
            var n = def.nodes[i];
            var sp = speakers.Find(s => s.id == n.speakerId);
            if (sp != null) { speakerName.text = sp.displayName.Get(); if (portrait != null) portrait.sprite = sp.portrait; }
            ClearChoices();
            fullText = n.text.Get();
            if (typing != null) StopCoroutine(typing);
            typing = StartCoroutine(Type());
        }

        IEnumerator Type()
        {
            body.text = fullText;
            body.maxVisibleCharacters = 0;
            int total = fullText.Length;
            float t = 0f;
            while (body.maxVisibleCharacters < total)
            {
                t += Time.unscaledDeltaTime * charsPerSecond;
                body.maxVisibleCharacters = Mathf.Min(total, Mathf.FloorToInt(t));
                yield return null;
            }
            typing = null;
            BuildChoices();
        }

        void BuildChoices()
        {
            var n = def.nodes[index];
            if (n.choices == null || n.choices.Length == 0) return;
            for (int c = 0; c < n.choices.Length; c++)
            {
                var b = Instantiate(choiceTemplate, choiceHost);
                b.gameObject.SetActive(true);
                b.GetComponentInChildren<TMP_Text>().text = n.choices[c].text.Get();
                int captured = c;
                b.onClick.AddListener(() => Choose(captured));
                choiceButtons.Add(b);
            }
            selected = 0;
            Highlight();
        }

        void ClearChoices() { foreach (var b in choiceButtons) if (b != null) Destroy(b.gameObject); choiceButtons.Clear(); }

        void Highlight()
        {
            for (int i = 0; i < choiceButtons.Count; i++)
                choiceButtons[i].transform.localScale = Vector3.one * (i == selected ? 1.03f : 1f);
        }

        void Choose(int c)
        {
            var n = def.nodes[index];
            if (!string.IsNullOrEmpty(n.setFlag)) Game.State.SetFlag(n.setFlag);
            ShowNode(n.choices[c].nextNode);
        }

        void Advance()
        {
            if (typing != null)                          // first press completes the line
            {
                StopCoroutine(typing); typing = null;
                body.maxVisibleCharacters = int.MaxValue;
                BuildChoices();
                return;
            }
            var n = def.nodes[index];
            if (n.choices != null && n.choices.Length > 0) { Choose(selected); return; }
            if (!string.IsNullOrEmpty(n.setFlag)) Game.State.SetFlag(n.setFlag);
            ShowNode(n.next);
        }

        void Close()
        {
            ClearChoices();
            root.SetActive(false);
            PlayerController.InputLocked = false;
            def = null;
            Game.Save();
        }

        void Update()
        {
            if (!IsOpen) return;
            var kb = Keyboard.current;
            if (kb == null) return;
            if (choiceButtons.Count > 0)
            {
                if (kb.downArrowKey.wasPressedThisFrame || kb.sKey.wasPressedThisFrame) { selected = (selected + 1) % choiceButtons.Count; Highlight(); }
                if (kb.upArrowKey.wasPressedThisFrame || kb.wKey.wasPressedThisFrame) { selected = (selected - 1 + choiceButtons.Count) % choiceButtons.Count; Highlight(); }
                if (kb.digit1Key.wasPressedThisFrame && choiceButtons.Count > 0) Choose(0);
                if (kb.digit2Key.wasPressedThisFrame && choiceButtons.Count > 1) Choose(1);
            }
            if (kb.eKey.wasPressedThisFrame || kb.enterKey.wasPressedThisFrame || kb.spaceKey.wasPressedThisFrame) Advance();
        }
    }
}
