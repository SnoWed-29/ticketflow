type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const categorySerializer = {
  item(category: CategoryRecord) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  },

  list(categories: CategoryRecord[]) {
    return categories.map((category) =>
      this.item(category),
    );
  },
};
