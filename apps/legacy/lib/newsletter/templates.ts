import { MessageSendingResponse } from 'postmark/dist/client/models';
import { postmarkClient } from './postmark';

type TemplateInput<T> = {
  from: string;
  to: string;
} & T;

type BatchTemplateInput<T> = {
  from: string;
  to: string[];
} & T;

type SendEmailTemplate<T = {}> = (props: TemplateInput<T>) => Promise<MessageSendingResponse>;
type SendBatchEmailTemplate<T = {}> = (props: BatchTemplateInput<T>) => Promise<MessageSendingResponse[]>;

type WelcomeEmailModel = {
  productUrl: string;
  productName: string;
};

export type ArticleGroup = {
  name: string;
  readMoreUrl: string;
  articles: {
    title: string;
    url: string;
  }[];
};

export type WeeklySummaryEmailModel = {
  productUrl: string;
  productName: string;
  articleGroups: ArticleGroup[];
};

export const sendWelcomeEmail: SendEmailTemplate<WelcomeEmailModel> = async (props) => {
  return postmarkClient.sendEmailWithTemplate({
    From: props.from,
    To: props.to,
    MessageStream: 'subscription-confirmation',
    TemplateAlias: 'welcome',
    TemplateModel: {
      product_url: props.productUrl,
      product_name: props.productName,
    },
  });
};

export const sendWeeklySummaryEmail: SendBatchEmailTemplate<WeeklySummaryEmailModel> = async (props) => {
  return postmarkClient.sendEmailBatchWithTemplates(
    props.to.map((to) => ({
      From: props.from,
      To: to,
      MessageStream: 'weekly-newsletter',
      TemplateAlias: 'weekly-newsletter',
      TemplateModel: {
        articleGroups: props.articleGroups,
        product_url: props.productUrl,
        product_name: props.productName,
      },
    }))
  );
};
