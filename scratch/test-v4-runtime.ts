/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../src/lib/prisma';
import { CategoryService } from '../src/server/services/category.service';
import { CollectionService } from '../src/server/services/collection.service';
import { generateSlug } from '../src/utils/slug';

async function main() {
  console.log('--- STARTING V4 RUNTIME TESTS ---\n');
  const testIds: string[] = [];

  try {
    // 1. Slug normalizer test
    console.log('Testing slug generator...');
    const s1 = generateSlug('Wedding Collection');
    const s2 = generateSlug('  New   Arrivals');
    if (s1 !== 'wedding-collection' || s2 !== 'new-arrivals') throw new Error('Slug generator failed');
    console.log('✅ Slug generator passed\n');

    // 2. Collection testing
    console.log('Testing collection domain...');
    const col1 = await CollectionService.createCollection({
      name: 'Summer Collection',
      slug: 'summer-collection',
      startsAt: new Date(Date.now() + 86400000), // tomorrow
      isActive: true,
    });
    testIds.push(`collection:${col1.id}`);
    
    // Future collection visibility
    const publicCols = await CollectionService.getCollections(true);
    if (publicCols.some((c: any) => c.id === col1.id)) throw new Error('Future collection visible in public API');
    console.log('✅ Future collection hiding passed');

    // Duplicate slug
    try {
      await CollectionService.createCollection({ name: 'Dup', slug: 'summer-collection' });
      throw new Error('Duplicate collection slug allowed');
    } catch (e: any) {
      if (!e.message.includes('slug already exists')) throw e;
      console.log('✅ Collection duplicate slug prevention passed');
    }
    console.log('✅ Collection domain passed\n');

    // 3. Category testing
    console.log('Testing category domain...');
    const catWomen = await CategoryService.createCategory({
      name: 'Women',
      slug: 'women',
    });
    testIds.push(`category:${catWomen.id}`);

    const catSarees = await CategoryService.createCategory({
      name: 'Sarees',
      slug: 'sarees',
      parentId: catWomen.id,
    });
    testIds.push(`category:${catSarees.id}`);

    // Hierarchy test
    const tree = await CategoryService.getCategoryTree();
    const womenTree: any = tree.find((c: any) => c.id === catWomen.id);
    if (!womenTree || womenTree.children[0].id !== catSarees.id) {
      throw new Error('Hierarchy tree failed');
    }
    console.log('✅ Category hierarchy and tree passed');

    // Self-parent test
    try {
      await CategoryService.updateCategory(catWomen.id, { parentId: catWomen.id });
      throw new Error('Self-parent allowed');
    } catch (e: any) {
      if (!e.message.includes('own parent')) throw e;
      console.log('✅ Self-parent prevention passed');
    }

    // Child-parent deletion protection test
    try {
      await CategoryService.deleteCategory(catWomen.id);
      throw new Error('Deleted parent with children allowed');
    } catch (e: any) {
      if (!e.message.includes('child categories')) throw e;
      console.log('✅ Parent deletion protection passed');
    }

    console.log('\n--- ALL V4 TESTS PASSED ---');
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    console.log('\nCleaning up temporary test data...');
    for (const id of testIds.reverse()) {
      const [type, actualId] = id.split(':');
      if (type === 'category') await prisma.category.delete({ where: { id: actualId } }).catch(() => {});
      if (type === 'collection') await prisma.collection.delete({ where: { id: actualId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main();
