export const Pagination = (value, page) => {
    const total = value.length;
    const perPage = 5;
    const pageCount = Math.ceil(total / perPage);
  
    if (page < 1) page = 1;
    else if (page > pageCount) page = pageCount;
  
    const from = (page - 1) * perPage;
    let to = page * perPage;
    if (to < 0) to = 0;
  
    const pageInfo = {
      data: value.slice(from, to),
      page,
      pageCount,
    };
    return pageInfo;
  };