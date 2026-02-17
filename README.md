# Export Products to Excel

## Endpoint

`GET /api/products/export/excel`

- Requires authentication (Bearer token)
- Returns an Excel file (`produits.xlsx`) containing all products with an intuitive cell design (styled headers, alternating row colors, borders, and filterable columns).

## Example usage

```
curl -X GET \
  -H "Authorization: Bearer <token>" \
  "$BASE_URL/api/products/export/excel" \
  --output produits.xlsx
```
Remplacez `$BASE_URL` par la valeur de votre environnement (ex: http://localhost:3000 ou https://votre-domaine.com).
