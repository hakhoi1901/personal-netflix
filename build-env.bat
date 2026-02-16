@echo off
set "PROJECT_PATH=%~dp0"
set "JAVA_HOME=%PROJECT_PATH%android-sdk\jdk-17"
set "ANDROID_HOME=%PROJECT_PATH%android-sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo [Theater] Moi truong Android da san sang!
cmd /k