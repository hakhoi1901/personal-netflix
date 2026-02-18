## B1

npm run app:build

## B2

$env:JAVA_HOME = "D:\Code\02_Projects\Active\Theater\android-sdk\jdk-21"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

## B3

cd android
.\gradlew clean assembleRelease

## B4

cd ..
& ".\android-sdk\build-tools\35.0.0\apksigner.bat" sign --ks my-release-key.jks --out horion.ver1.2.1.apk ".\android\app\build\outputs\apk\release\app-release-unsigned.apk"