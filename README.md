# シフト表（Next.js）

## ローカル起動
1. `cp .env.local.example .env.local` して `STORES` を編集
2. `npm install` → `npm run dev` → http://localhost:3000

## GitHub へプッシュ
```
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
git push -u origin main
```

## Vercel へデプロイ
1. Vercel で「Add New → Project」から、そのリポジトリを Import（設定は初期値のままでOK）
2. Settings → Environment Variables に `SUPER_ADMIN_USER` と `SUPER_ADMIN_PASSWORD` を追加（全体管理画面のログイン用）。従来どおり `STORES`（JSON）で店舗を固定登録することもできます
3. Storage（または Marketplace）から **Upstash Redis** を作成してこのプロジェクトに接続（`KV_REST_API_URL` などが自動で入ります）
4. Deploy（環境変数やStorageを追加・変更したあとは Redeploy）

## URL
- `/` 店舗一覧
- `/s/<店舗ID>` 管理画面（ログイン必須）
- `/s/<店舗ID>/submit` スタッフの希望提出画面

## 店舗の追加
`/admin` で全体管理ログイン → 店舗ID・店舗名・ユーザー名・パスワードを入力して追加します（店舗データの保存に Upstash Redis が必要です）。
