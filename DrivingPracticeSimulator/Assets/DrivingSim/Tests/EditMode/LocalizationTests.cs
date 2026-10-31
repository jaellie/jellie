using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using DrivingSim.Core;
using NUnit.Framework;
using UnityEngine;

namespace DrivingSim.Tests
{
    public class LocalizationTests
    {
        static string Root => Path.Combine(Application.dataPath, "DrivingSim");

        static StringTableData LoadData()
        {
            string path = Path.Combine(Root, "Resources", "Localization", "strings.json");
            Assert.IsTrue(File.Exists(path), path);
            return JsonUtility.FromJson<StringTableData>(File.ReadAllText(path));
        }

        static IEnumerable<string> Placeholders(string text) =>
            Regex.Matches(text ?? "", @"\{(\d+)(?::[^}]*)?\}").Cast<Match>().Select(m => m.Groups[1].Value).Distinct().OrderBy(s => s);

        [Test]
        public void StringTable_FallsBackToKorean_ThenToKey()
        {
            var table = new StringTable(new[]
            {
                new StringEntry { key = "a", ko = "가", en = "A" },
                new StringEntry { key = "b", ko = "나", en = "" },
            });
            Assert.AreEqual("A", table.Get("a", Language.EnglishUS));
            Assert.AreEqual("나", table.Get("b", Language.EnglishUS));
            Assert.AreEqual("[missing]", table.Get("missing", Language.Korean));
            CollectionAssert.AreEquivalent(new[] { "b" }, table.MissingTranslations(Language.EnglishUS));
        }

        [Test]
        public void StringTable_ReportsDuplicates()
        {
            var table = new StringTable(new[] { new StringEntry { key = "a", ko = "1" }, new StringEntry { key = "a", ko = "2" } });
            CollectionAssert.AreEquivalent(new[] { "a" }, table.DuplicateKeys);
        }

        [Test]
        public void LanguageCodes_RoundTrip()
        {
            foreach (Language language in LanguageInfo.All)
            {
                Assert.IsTrue(LanguageInfo.TryParse(LanguageInfo.Code(language), out Language parsed));
                Assert.AreEqual(language, parsed);
            }
            Assert.IsFalse(LanguageInfo.TryParse("fr-FR", out _));
        }

        [Test]
        public void Disclaimer_NewVersionNeedsAcknowledgmentAgain()
        {
            Assert.IsTrue(DisclaimerPolicy.NeedsAcknowledgment(0));
            Assert.IsFalse(DisclaimerPolicy.NeedsAcknowledgment(DisclaimerPolicy.CurrentVersion));
        }

        [Test]
        public void StringsJson_IsCompleteAndConsistent()
        {
            StringTableData data = LoadData();
            var table = new StringTable(data.entries);
            CollectionAssert.IsEmpty(table.DuplicateKeys, "duplicate keys");
            CollectionAssert.IsEmpty(table.MissingTranslations(Language.Korean), "missing Korean");
            CollectionAssert.IsEmpty(table.MissingTranslations(Language.EnglishUS), "missing English");
            foreach (StringEntry entry in data.entries)
                CollectionAssert.AreEqual(Placeholders(entry.ko).ToList(), Placeholders(entry.en).ToList(), $"placeholders differ in '{entry.key}'");
        }

        [Test]
        public void EveryKeyUsedInCode_ExistsInStringsJson()
        {
            var table = new StringTable(LoadData().entries);
            var pattern = new Regex("\"((?:gear|shift|parkingBrake|signal|hazard|headlights|wipers|camera|hud|toast|nav|pause|wizard|disclaimer|language|common|map|menu|environments)\\.[A-Za-z0-9.]*[A-Za-z0-9])\"");
            var missing = new List<string>();
            foreach (string file in Directory.GetFiles(Root, "*.cs", SearchOption.AllDirectories))
            {
                if (file.Replace('\\', '/').Contains("/Tests/")) continue;
                foreach (Match match in pattern.Matches(File.ReadAllText(file)))
                    if (!table.Contains(match.Groups[1].Value)) missing.Add($"{Path.GetFileName(file)}: {match.Groups[1].Value}");
            }
            foreach (string gear in new[] { "P", "R", "N", "D" })
                if (!table.Contains("gear.name." + gear)) missing.Add("gear.name." + gear);
            CollectionAssert.IsEmpty(missing);
        }

        [Test]
        public void DisclaimerText_MatchesApprovedWording()
        {
            var table = new StringTable(LoadData().entries);
            Assert.AreEqual("이 게임은 실제 운전 감각을 익히기 위한 연습용 시뮬레이터이며, 실제 도로에서의 안전한 운전 능력을 검증하는 도구가 아닙니다. 차량 조작감과 주행 환경은 실제 차량과 다를 수 있습니다.",
                table.Get("disclaimer.body", Language.Korean));
            Assert.AreEqual("This simulator is intended for driving practice. It does not assess your ability to drive safely on real roads. Vehicle controls and driving conditions may differ from those of a real car.",
                table.Get("disclaimer.body", Language.EnglishUS));
        }
    }
}
