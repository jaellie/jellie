using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;

namespace DearMe.Content
{
    /// <summary>
    /// Replaces nulls left by a deserializer (missing strings, arrays, lists, nested objects)
    /// with empty values, so game code can rely on "never null" for loaded content and saves.
    /// </summary>
    public static class ContentSanitizer
    {
        public static T Sanitize<T>(T obj) where T : class
        {
            if (obj != null) Visit(obj, 0);
            return obj;
        }

        const int MaxDepth = 16;

        static void Visit(object obj, int depth)
        {
            if (obj == null || depth > MaxDepth) return;
            var type = obj.GetType();
            foreach (var field in type.GetFields(BindingFlags.Public | BindingFlags.Instance))
            {
                var ft = field.FieldType;
                object value = field.GetValue(obj);

                if (ft == typeof(string))
                {
                    if (value == null) field.SetValue(obj, "");
                    continue;
                }
                if (ft.IsArray)
                {
                    if (value == null)
                    {
                        field.SetValue(obj, Array.CreateInstance(ft.GetElementType(), 0));
                        continue;
                    }
                    var arr = (Array)value;
                    var et = ft.GetElementType();
                    for (int i = 0; i < arr.Length; i++)
                    {
                        if (et == typeof(string)) { if (arr.GetValue(i) == null) arr.SetValue("", i); }
                        else if (IsSerializableClass(et))
                        {
                            if (arr.GetValue(i) == null) arr.SetValue(Activator.CreateInstance(et), i);
                            Visit(arr.GetValue(i), depth + 1);
                        }
                    }
                    continue;
                }
                if (ft.IsGenericType && ft.GetGenericTypeDefinition() == typeof(List<>))
                {
                    if (value == null)
                    {
                        value = Activator.CreateInstance(ft);
                        field.SetValue(obj, value);
                    }
                    var list = (IList)value;
                    var et = ft.GetGenericArguments()[0];
                    for (int i = list.Count - 1; i >= 0; i--)
                    {
                        if (list[i] == null)
                        {
                            if (et == typeof(string)) list[i] = "";
                            else list.RemoveAt(i);
                        }
                        else if (IsSerializableClass(et)) Visit(list[i], depth + 1);
                    }
                    continue;
                }
                if (IsSerializableClass(ft))
                {
                    if (value == null)
                    {
                        value = Activator.CreateInstance(ft);
                        field.SetValue(obj, value);
                    }
                    Visit(value, depth + 1);
                }
            }
        }

        static bool IsSerializableClass(Type t) =>
            t.IsClass && t != typeof(string) && t.IsDefined(typeof(SerializableAttribute), false) && t.GetConstructor(Type.EmptyTypes) != null;
    }
}
