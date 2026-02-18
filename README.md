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

# Import Products from Excel (Template)

## Endpoint

`POST /api/products/import/excel`

- Requires authentication (Bearer token)
- Upload an Excel file in form-data with field name `file`

## Colonnes (ligne 1)

Nom | Prix | Stock | Categorie | Description | Marque | Ingredients | PackageUnit | Flavors | Flavors_Descriptions | Flavors_Images | PriceRoles_Codes | PriceRoles_Prices

## Exemples

Nom | Prix | Stock | Categorie | Description | Marque | Ingredients | PackageUnit | Flavors | Flavors_Descriptions | Flavors_Images | PriceRoles_Codes | PriceRoles_Prices
Biscuit A | 10.5 | 100 | 1 | Biscuit au beurre | LU | Farine,Beurre,Sucre | 12 | Vanille,Chocolat | Arome vanille/Chocolate | vanille.png/chocolat.png | ADMIN,RESELLER | 9.5,8.0
Biscuit B | 8 | 50 | 2 | Biscuit a la fraise | BN | Farine,Fraise,Sucre | 6 | Fraise | Gout fraise | fraise.png | RESELLER | 7.5

## Regles

- Flavors: noms separes par virgule.
- Flavors_Descriptions: descriptions separees par "/" et dans le meme ordre que Flavors.
- Flavors_Images: images separees par "/" et dans le meme ordre que Flavors.
- PriceRoles_Codes: codes roles separes par virgule.
- PriceRoles_Prices: prix separes par virgule, dans le meme ordre que PriceRoles_Codes.
- Statut non present: actif par defaut.

## Comportement import (validation et erreurs)

- Toutes les colonnes produit et flavors sont obligatoires: Nom, Prix, Stock, Categorie, Description, Marque, Ingredients, PackageUnit, Flavors, Flavors_Descriptions, Flavors_Images.
- Si une ligne est invalide, elle n'est pas importee.
- Les lignes invalides sont marquees en rouge dans un fichier Excel d'erreurs, avec la raison dans la derniere colonne (Import_Erreur).
- L'API retourne un JSON avec `created`, `errors` et `errorFileUrl` (si des erreurs existent).

## Example usage

```
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@produits.xlsx" \
  "$BASE_URL/api/products/import/excel"
```
