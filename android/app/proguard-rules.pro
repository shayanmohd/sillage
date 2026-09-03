# JS bridge: the WebView calls these by name via reflection.
-keepclassmembers class com.mohdshayan.sillage.MainActivity$Native { public *; }
-keep class com.mohdshayan.sillage.MainActivity$Native { *; }
