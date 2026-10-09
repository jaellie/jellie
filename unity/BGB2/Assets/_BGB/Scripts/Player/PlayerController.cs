using UnityEngine;
using UnityEngine.InputSystem;

namespace BGB2
{
    /// <summary>Soft, slightly heavy side-view walk. Never flips the sprite: separate left/right/front sprites are
    /// swapped so BGB stays left-handed (STORY_BIBLE Hard Rule 6).</summary>
    public class PlayerController : MonoBehaviour
    {
        public SpriteRenderer body;
        public Sprite front, left, right;
        public float walkSpeed = 2.7f, runSpeed = 4.3f;
        public float minX = 4.7f, maxX = 36.5f;
        public float acceleration = 14f;

        float velocity;
        float walkPhase;
        Vector3 baseLocalPos;

        public static bool InputLocked;   // set while dialogue, Case File or popups are open

        void Awake() { baseLocalPos = body != null ? body.transform.localPosition : Vector3.zero; }

        void Update()
        {
            var kb = Keyboard.current;
            float target = 0f;
            if (!InputLocked && kb != null)
            {
                bool l = kb.aKey.isPressed || kb.leftArrowKey.isPressed;
                bool r = kb.dKey.isPressed || kb.rightArrowKey.isPressed;
                if (l != r) target = (r ? 1f : -1f) * (kb.leftShiftKey.isPressed ? runSpeed : walkSpeed);
            }
            velocity = Mathf.MoveTowards(velocity, target, acceleration * Time.deltaTime);
            var p = transform.position;
            p.x = Mathf.Clamp(p.x + velocity * Time.deltaTime, minX, maxX);
            transform.position = p;

            bool moving = Mathf.Abs(velocity) > 0.05f;
            if (body != null)
            {
                body.sprite = !moving ? front : (velocity > 0f ? right : left);
                walkPhase += Mathf.Abs(velocity) * Time.deltaTime * 2.2f;
                float bob = moving ? Mathf.Abs(Mathf.Sin(walkPhase)) * 0.05f : 0f;      // gentle, not bouncy
                body.transform.localPosition = baseLocalPos + new Vector3(0f, bob, 0f);
            }
        }
    }
}
