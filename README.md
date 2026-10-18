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
2. Settings → Environment Variables に `STORES` を追加（`.env.local.example` と同じJSON。パスワードは必ず変更）
3. Storage（または Marketplace）から **Upstash Redis** を作成してこのプロジェクトに接続（`KV_REST_API_URL` などが自動で入ります）
4. Deploy（環境変数やStorageを追加・変更したあとは Redeploy）

## URL
- `/` 店舗一覧
- `/s/<店舗ID>` 管理画面（ログイン必須）
- `/s/<店舗ID>/submit` スタッフの希望提出画面
