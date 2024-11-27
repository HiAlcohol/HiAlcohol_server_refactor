import { db } from "../../config/db.js";

async function getAllLists() {
    const getAllListsQuery = `
        select recipe.id, recipe.cocktail, material.material from recipe, material 
        where material.id =any(select inclusion.materialId from inclusion where inclusion.recipeId= recipe.id)
        order by recipe.cocktail asc
    `;
    const [allLists] = await db.query(getAllListsQuery);
    return allLists;
}

async function getSearchLists(keyword) {
    const getSearchListsQuery = `
        select recipe.cocktail, recipe.id, material.material from recipe, material  
        where ((recipe.cocktail= ?) and (material.id = 
        any(select inclusion.materialId from inclusion where inclusion.recipeId = 
        (select recipe.id from recipe where recipe.cocktail = ?)))) or
        (recipe.id=any(select recipeId from inclusion 
        where (materialId = any(select id from material where instr(material, ?) or 
        material = any(select alcolType from product where instr(name, ?)))) 
        and material.id = 
        any(select inclusion.materialId from inclusion where inclusion.recipeId= recipe.id )))
        order by recipe.cocktail asc;
    `;
    const checkCocktailQuery = `
        select id from recipe where cocktail = ?
    `
    const getSearchListsByCocktailQuery = `
        select recipe.cocktail, recipe.id, material.material from recipe, material
	    where ((recipe.cocktail= ?) and (material.id in (select inclusion.materialId from inclusion where inclusion.recipeId = 
        (select recipe.id from recipe where recipe.cocktail = ?))));
    `
    const checkMaterialQuery = `
        select id from material where material = ?
    `
    const checkAlcolProductQuery = `
        select id from product where name = ?
    `
    const getSearchListsByMaterialQuery = `
        select recipe.cocktail, recipe.id, material.material from recipe, material
        where (recipe.id=any(select recipeId from inclusion 
        where (materialId = any(select id from material where instr(material, ?) or 
        material = any(select alcolType from product where instr(name, ?))))
        and material.id = 
        any(select inclusion.materialId from inclusion where inclusion.recipeId= recipe.id )))
        order by recipe.cocktail asc;
    `
    /// search by cocktail, material, product at once
    // const [searchLists] = await db.query(getSearchListsQuery, [keyword, keyword, keyword, keyword])
    // return searchLists;

    const [cocktail] = await db.query(checkCocktailQuery, [keyword])
    const [material] = await db.query(checkMaterialQuery, [keyword])
    const [product] = await db.query(checkAlcolProductQuery, [keyword])
    /// search by cocktail
    if (cocktail.length > 0) {
        const [searchLists] = await db.query(getSearchListsByCocktailQuery, [keyword, keyword]);
        return searchLists;
    /// search by material or product    
    } else if (material.length > 0 || product.length > 0) {
         const [searchLists] = await db.query(getSearchListsByMaterialQuery, [keyword, keyword]);
         return searchLists;
    }
}

async function getAllRecipes() {
    const getAllRecipesQuery = `
        select recipe.*, material.material from recipe, material 
        where material.id =any(select inclusion.materialId from inclusion where inclusion.recipeId= recipe.id)
        order by recipe.cocktail asc;
    `;
    const [allRecipes] = await db.query(getAllRecipesQuery);
    return allRecipes;
}

async function getSearchRecipe(recipeId) {
    const getSearchRecipeQuery = `
        select recipe.*, material.material from recipe, material 
        where (material.id=any(select inclusion.materialId from inclusion where inclusion.recipeId= ?)) 
        and (recipe.id= ?)
    `;
    const [recipe] = await db.query(getSearchRecipeQuery, [recipeId, recipeId]);
    return recipe;
}

export {
    getSearchLists,
    getAllLists,
    getAllRecipes,
    getSearchRecipe
};
