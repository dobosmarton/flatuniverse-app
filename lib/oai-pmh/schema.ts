import { z } from 'zod';
import { categoriesGroupedByShortName } from '../article-metadata/categories';

const authorSchema = z.object({
  keyname: z.string().or(z.number()),
  forenames: z.string().optional(),
  affiliation: z.string().or(z.array(z.string())).optional(),
});

const resumptionTokenSchema = z
  .object({
    '@_cursor': z.string(),
    '@_completeListSize': z.string(),
    '#text': z.string().optional(),
  })
  .transform((resumptionToken) => ({
    cursor: resumptionToken['@_cursor'],
    completeListSize: resumptionToken['@_completeListSize'],
    token: resumptionToken['#text'],
  }));

const errorSchema = z
  .object({
    '@_code': z.string(),
    '#text': z.string().optional(),
  })
  .transform((error) => ({
    code: error['@_code'],
    message: error['#text'],
  }));

/*

{
  "header": {
    "identifier": "oai:arXiv.org:0704.0495",
    "datestamp": "2024-02-13",
    "setSpec": ["math", "physics:math-ph", "physics:quant-ph"]
  },
  "metadata": {
    "arXiv": {
      "id": 704.0495,
      "created": "2007-04-04",
      "updated": "2007-07-02",
      "authors": {
        "author": [
          { "keyname": "Saniga", "forenames": "Metod", "affiliation": "ASTRINSTSAV" },
          { "keyname": "Planat", "forenames": "Michel", "affiliation": "FEMTO-ST" },
          { "keyname": "Pracna", "forenames": "Petr", "affiliation": "JH-Inst" },
          { "keyname": "Havlicek", "forenames": "Hans", "affiliation": "TUW" }
        ]
      },
      "title": "The Veldkamp Space of Two-Qubits",
      "categories": "quant-ph math-ph math.MP",
      "comments": "7 pages, 3 figures, 2 tables; Version 2 - math nomenclature\n  fine-tuned and two references added; Version 3 - published in SIGMA\n  (Symmetry, Integrability and Geometry: Methods and Applications) at\n  http://www.emis.de/journals/SIGMA/",
      "journal-ref": "SIGMA 3 (2007) 075, 7 pages",
      "doi": "10.3842/SIGMA.2007.075",
      "abstract": "Given a remarkable representation of the generalized Pauli operators of\ntwo-qubits in terms of the points of the generalized quadrangle of order two,\nW(2), it is shown that specific subsets of these operators can also be\nassociated with the points and lines of the four-dimensional projective space\nover the Galois field with two elements - the so-called Veldkamp space of W(2).\nAn intriguing novelty is the recognition of (uni- and tri-centric) triads and\nspecific pentads of the Pauli operators in addition to the \"classical\" subsets\nanswering to geometric hyperplanes of W(2).",
      "@_xmlns": "http://arxiv.org/OAI/arXiv/",
      "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "@_xsi:schemaLocation": "http://arxiv.org/OAI/arXiv/ http://arxiv.org/OAI/arXiv.xsd"
    }
  }
}

*/

export const metadataSchema = z
  .object({
    arXiv: z.object({
      id: z.string().or(z.number()),
      created: z.string(),
      updated: z.string().optional(),
      authors: z.object({
        author: z.array(authorSchema).or(authorSchema),
      }),
      title: z.string(),
      categories: z.string(),
      comments: z.string().or(z.number()).optional(),
      'journal-ref': z.string().or(z.number()).optional(),
      doi: z.string().optional(),
      abstract: z.string(),
    }),
  })
  .transform(({ arXiv: { id, authors, categories, comments, ...rest } }) => {
    return {
      ...rest,
      id: `${id}`,
      authors: Array.isArray(authors.author) ? authors.author : [authors.author],
      comment: comments ? `${comments}` : undefined,
      categories: categories.split(' '),
      published: new Date(rest.created),
      updated: rest.updated ? new Date(rest.updated) : new Date(rest.created),
    };
  })
  .transform((entry) => ({
    ...entry,
    links: [
      { title: 'pdf', href: `https://arxiv.org/pdf/${entry.id}`, type: 'application/pdf', rel: 'related' },
      { title: '', href: `https://arxiv.org/abs/${entry.id}`, type: 'text/html', rel: 'alternate' },
    ],
    authors: entry.authors.map((author) => ({
      name: `${author.forenames} ${author.keyname}`.trim(),
    })),
    categories: entry.categories
      .filter((category): category is string => !!category && !!categoriesGroupedByShortName[category])
      .map((category) => {
        const _category = categoriesGroupedByShortName[category];
        return {
          isPrimary: false,
          shortName: _category.shortName,
          fullName: _category.longName,
          groupName: _category.group,
        };
      }),
  }));

const listRecordsSchema = z.object({
  header: z.object({
    identifier: z.string(),
    datestamp: z.string(),
    setSpec: z.array(z.string()).or(z.string()).optional(),
  }),
  metadata: metadataSchema,
});

export const articleMetadataSchema = z
  .object({
    responseDate: z.string(),
    updated: z.string().optional(),
    error: errorSchema.optional(),
    ListRecords: z
      .object({
        record: z.array(listRecordsSchema).or(listRecordsSchema),
        resumptionToken: resumptionTokenSchema.optional(),
      })
      .optional(),
  })
  .optional()
  .transform((props) => {
    if (!props?.ListRecords) {
      return {
        records: [],
        resumptionToken: undefined,
        error: props?.error ?? undefined,
      };
    }

    return {
      ...props,
      records: Array.isArray(props.ListRecords.record) ? props.ListRecords.record : [props.ListRecords.record],
      resumptionToken: props.ListRecords.resumptionToken,
    };
  });

export type ArticleMetadata = z.infer<typeof articleMetadataSchema>;
export type ResumptionToken = z.infer<typeof resumptionTokenSchema>;
export type Metadata = z.infer<typeof metadataSchema>;
