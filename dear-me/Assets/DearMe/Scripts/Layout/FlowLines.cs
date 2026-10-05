using System.Collections.Generic;

namespace DearMe.Layout
{
    /// <summary>
    /// Pure line-breaking for token flows: items glued to their predecessor form one
    /// unbreakable unit; units wrap when the line is full; a unit wider than the line
    /// gets a line of its own.
    /// </summary>
    public static class FlowLines
    {
        /// <param name="lineOf">Output: line index per item.</param>
        /// <param name="lineWidths">Output: used width per line (including spacing between units).</param>
        public static void Break(IList<float> widths, IList<bool> glue, float inner, float spacing,
            List<int> lineOf, List<float> lineWidths)
        {
            lineOf.Clear();
            lineWidths.Clear();
            int lineIndex = 0;
            float lineWidth = 0f;
            bool lineHasItems = false;
            int k = 0;
            while (k < widths.Count)
            {
                int unitEnd = k + 1;
                float unitWidth = widths[k];
                while (unitEnd < widths.Count && glue[unitEnd]) unitWidth += widths[unitEnd++];

                float needed = (lineHasItems ? spacing : 0f) + unitWidth;
                if (lineHasItems && lineWidth + needed > inner + 0.5f)
                {
                    lineWidths.Add(lineWidth);
                    lineIndex++;
                    lineWidth = 0f;
                    needed = unitWidth;
                }
                lineWidth += needed;
                lineHasItems = true;
                for (int n = k; n < unitEnd; n++) lineOf.Add(lineIndex);
                k = unitEnd;
            }
            if (widths.Count > 0) lineWidths.Add(lineWidth);
        }
    }
}
