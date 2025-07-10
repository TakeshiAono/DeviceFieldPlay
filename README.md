# デプロイ

## lambdaへのデプロイ方法

<!-- TODO: 将来的にはCloudFormationで行う -->

AWS access portalで`DeviceFieldPlayDev`にログインする

### zipをアップロードする方法

(最初のデプロイやnpmモジュールを追加した場合はこちらのデプロイ方法で行う必要あり)

1. デプロイしたい該当のlambdaへ移動する
2. `zip -r ../layer .`でlayer.zipを作成する。
3. zipファイルを該当のlambdaへアップロードする。

### 直接lambdaのindex.mjsを編集する方法

1. ブラウザで該当のlambdaのindex.mjsを直接編集し、デプロイボタンを押して反映させる。
2. うまく実装ができたら、編集した内容をローカルファイルにコピペしてgithub管理できるようにする。

## 開発用アプリのデプロイ方法

新しいnpmモジュールを入れるたびにデプロイ(クラウド上でead build)しないとエラーになります。

1. `eas whoami`コマンドでデプロイ先のexpoアカウントかを確認する。※間違っていると別のアカウントprojectにデプロイしてしまうので注意
2. `eas build --profile development --platform android`コマンドにて開発アプリをデプロイ

### エミュレーターでアプリを動かす方法

1. Android Studioにて該当の仮想デバイスをインストールして立ち上げる。

   - 参考: https://developer.android.com/studio/run/managing-avds?hl=ja

2. expoクラウドにあるdevelopmentビルドをローカルPCに.apkファイルをダウンロードする。

3. 立ち上げた仮想デバイスに.apkファイルをドラッグアンドドロップ

## 本番環境のデプロイ方法

### Androidデプロイ

`eas submit --platform android`コマンドでsubmitできる。
--profile developmentだと.apkファイルがビルドされるが
上記のコマンドはproductionでビルドされその場合は.aabファイルがビルドされる。
それを`google play console`に.aabファイルを手動アップロードしてデプロイandリリースする(初回だけ？)

### iosデプロイ

`eas build --profile production --platform ios`コマンドでeas上で本番環境ビルドを行う。
ビルド完了後.ipaファイルがダウンロードできるようになる。
macPCにて`Transporter`というアプリをインストールして、そこで.ipaがデプロイできるようになる。
