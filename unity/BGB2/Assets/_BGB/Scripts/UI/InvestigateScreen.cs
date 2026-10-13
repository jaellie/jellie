using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

namespace BGB2
{
    /// <summary>Glue for the Investigate screen: routes interactions, evidence, Case File, inspect card, language and saving.</summary>
    public class InvestigateScreen : MonoBehaviour
    {
        public DialogueView dialogue;
        public CaseFileView caseFile;
        public CategoryPanel categories;
        public PlayerController player;

        [Header("Inspect card")]
        public GameObject inspectRoot;
        public TMP_Text inspectTitle, inspectBody;
        public Image inspectIcon;
        public Button inspectClose;

        [Header("Toast")]
        public CanvasGroup toast;
        public TMP_Text toastText;

        EvidenceDefinition inspecting;
        Coroutine toastRoutine;
        float saveTimer;

        void OnEnable() { Interactable.Activated += OnInteract; }
        void OnDisable() { Interactable.Activated -= OnInteract; }

        void Start()
        {
            Game.Load();
            if (player != null) { var p = player.transform.position; p.x = Mathf.Clamp(Game.State.playerX, player.minX, player.maxX); player.transform.position = p; }
            categories.onSelect = i => { if (!dialogue.IsOpen && !inspectRoot.activeSelf) caseFile.Open(i); else if (caseFile.IsOpen) caseFile.Open(i); };
            inspectClose.onClick.AddListener(CloseInspect);
            inspectRoot.SetActive(false);
            categories.SetSelected(0);
        }

        void Update()
        {
            var kb = Keyboard.current;
            if (kb != null)
            {
                if (kb.f2Key.wasPressedThisFrame) Loc.Set(Loc.Current == Language.English ? Language.Korean : Language.English);
                if (inspectRoot.activeSelf && (kb.eKey.wasPressedThisFrame || kb.escapeKey.wasPressedThisFrame)) CloseInspect();
            }
            saveTimer += Time.unscaledDeltaTime;
            if (saveTimer > 4f && player != null) { saveTimer = 0f; Game.State.playerX = player.transform.position.x; Game.Save(); }
        }

        void OnInteract(Interactable i)
        {
            if (i.dialogue != null) { dialogue.Play(i.dialogue); return; }
            if (i.evidence != null) { Inspect(i.evidence); return; }
            if (!string.IsNullOrEmpty(i.loadScene)) Toast(Loc.Current == Language.Korean ? "다음 단계: 시계탑 장면" : "Next milestone: the Clocktower scene");
        }

        public void Inspect(EvidenceDefinition def)
        {
            inspecting = def;
            PlayerController.InputLocked = true;
            inspectTitle.text = def.displayName.Get();
            inspectBody.text = def.Description;
            if (inspectIcon != null) { inspectIcon.sprite = def.icon; inspectIcon.enabled = def.icon != null; }
            inspectRoot.SetActive(true);
        }

        void CloseInspect()
        {
            inspectRoot.SetActive(false);
            PlayerController.InputLocked = false;
            if (inspecting != null && Game.AddEvidence(inspecting))
                Toast((Loc.Current == Language.Korean ? "증거 추가: " : "Evidence added: ") + inspecting.displayName.Get());
            inspecting = null;
        }

        void Toast(string msg)
        {
            toastText.text = msg;
            if (toastRoutine != null) StopCoroutine(toastRoutine);
            toastRoutine = StartCoroutine(ToastRoutine());
        }

        IEnumerator ToastRoutine()
        {
            toast.alpha = 1f;
            yield return new WaitForSecondsRealtime(1.9f);
            while (toast.alpha > 0f) { toast.alpha -= Time.unscaledDeltaTime / 0.3f; yield return null; }
        }
    }
}
