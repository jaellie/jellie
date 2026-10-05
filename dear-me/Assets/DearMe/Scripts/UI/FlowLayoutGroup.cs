using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

namespace DearMe.UI
{
    /// <summary>Marks a child that must stay on the same line as the previous child (no space, no wrap).</summary>
    public class FlowGlue : MonoBehaviour
    {
    }

    /// <summary>
    /// Wraps children like words in a paragraph. Glued children (FlowGlue) form one
    /// unbreakable unit, so "신청" + "하려고 해" never splits across lines.
    ///
    /// Line breaking depends only on widths, so x/width are applied in the horizontal pass
    /// (children then know their width before their own vertical pass) and y/height in the
    /// vertical pass — the same order uGUI uses for its own layout groups.
    /// </summary>
    public class FlowLayoutGroup : LayoutGroup
    {
        public float spacingX = 10f;
        public float spacingY = 8f;
        /// <summary>Horizontal alignment of each line: 0 left, 0.5 center.</summary>
        public float lineAlign = 0f;

        struct Item
        {
            public RectTransform rt;
            public float w;
            public bool glue;
            public int line;
        }

        readonly List<Item> items = new List<Item>();
        readonly List<float> lineWidths = new List<float>();
        float totalHeight;

        public override void CalculateLayoutInputHorizontal()
        {
            base.CalculateLayoutInputHorizontal();
            float maxUnit = 0f, total = 0f;
            float unit = 0f;
            for (int i = 0; i < rectChildren.Count; i++)
            {
                var rt = rectChildren[i];
                float w = LayoutUtility.GetPreferredWidth(rt);
                bool glue = i > 0 && rt.GetComponent<FlowGlue>() != null;
                unit = glue ? unit + w : w;
                maxUnit = Mathf.Max(maxUnit, unit);
                total += w + (glue || i == 0 ? 0f : spacingX);
            }
            // Min width: the widest unbreakable unit (capped so huge units clamp instead of forcing overflow).
            SetLayoutInputForAxis(Mathf.Min(maxUnit, 240f) + padding.horizontal, total + padding.horizontal, -1, 0);
        }

        public override void SetLayoutHorizontal()
        {
            BreakLines(rectTransform.rect.width);
            float inner = InnerWidth(rectTransform.rect.width);
            float x = 0f;
            int currentLine = -1;
            for (int i = 0; i < items.Count; i++)
            {
                var it = items[i];
                if (it.line != currentLine)
                {
                    currentLine = it.line;
                    x = padding.left + Mathf.Max(0f, inner - lineWidths[currentLine]) * lineAlign;
                }
                else if (!it.glue) x += spacingX;
                float w = Mathf.Min(it.w, inner);
                SetChildAlongAxis(it.rt, 0, x, w);
                x += w;
            }
        }

        public override void CalculateLayoutInputVertical()
        {
            BreakLines(rectTransform.rect.width);
            totalHeight = padding.vertical;
            float lineH = 0f;
            int currentLine = -1;
            for (int i = 0; i < items.Count; i++)
            {
                if (items[i].line != currentLine)
                {
                    if (currentLine >= 0) totalHeight += lineH + spacingY;
                    currentLine = items[i].line;
                    lineH = 0f;
                }
                lineH = Mathf.Max(lineH, LayoutUtility.GetPreferredHeight(items[i].rt));
            }
            if (currentLine >= 0) totalHeight += lineH;
            SetLayoutInputForAxis(totalHeight, totalHeight, -1, 1);
        }

        public override void SetLayoutVertical()
        {
            float y = padding.top;
            int start = 0;
            while (start < items.Count)
            {
                int line = items[start].line;
                int end = start;
                float lineH = 0f;
                while (end < items.Count && items[end].line == line)
                {
                    lineH = Mathf.Max(lineH, LayoutUtility.GetPreferredHeight(items[end].rt));
                    end++;
                }
                for (int i = start; i < end; i++)
                {
                    float h = LayoutUtility.GetPreferredHeight(items[i].rt);
                    // Bottom-align within the line so mixed sizes share a baseline-ish edge.
                    SetChildAlongAxis(items[i].rt, 1, y + (lineH - h), h);
                }
                y += lineH + spacingY;
                start = end;
            }
        }

        float InnerWidth(float width) => Mathf.Max(1f, width - padding.horizontal);

        readonly List<float> widths = new List<float>();
        readonly List<bool> glues = new List<bool>();
        readonly List<int> lineOf = new List<int>();

        void BreakLines(float width)
        {
            items.Clear();
            widths.Clear();
            glues.Clear();
            for (int i = 0; i < rectChildren.Count; i++)
            {
                var rt = rectChildren[i];
                float w = LayoutUtility.GetPreferredWidth(rt);
                bool glue = i > 0 && rt.GetComponent<FlowGlue>() != null;
                items.Add(new Item { rt = rt, w = w, glue = glue });
                widths.Add(w);
                glues.Add(glue);
            }
            DearMe.Layout.FlowLines.Break(widths, glues, InnerWidth(width), spacingX, lineOf, lineWidths);
            for (int i = 0; i < items.Count; i++)
            {
                var it = items[i];
                it.line = lineOf[i];
                items[i] = it;
            }
        }
    }
}
