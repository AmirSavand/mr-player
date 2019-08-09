import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Account } from '@app/interfaces/account';
import { ApiResponse } from '@app/interfaces/api-response';
import { Category } from '@app/interfaces/category';
import { Party } from '@app/interfaces/party';
import { PartyUser } from '@app/interfaces/party-user';
import { Song } from '@app/interfaces/song';
import { environment } from '@environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  /**
   * Base API endpoint
   */
  static readonly base: string = environment.api;

  constructor(private http: HttpClient) {
  }

  /**
   * Get party list
   */
  getParties(): Observable<ApiResponse<Party>> {
    return this.http.get<ApiResponse<Party>>(`${ApiService.base}parties/`).pipe();
  }

  /**
   * Get party data
   *
   * @param id Party ID
   */
  getParty(id: string): Observable<Party> {
    return this.http.get<Party>(`${ApiService.base}parties/${id}/`).pipe();
  }

  /**
   * Create new party
   *
   * @param title Party title
   */
  createParty(title?: string): Observable<Party> {
    return this.http.post<Party>(`${ApiService.base}parties/`, { title }).pipe();
  }

  /**
   * Update party title
   *
   * @param id Party ID
   * @param title Party title
   */
  updateParty(id: string, title: string): Observable<Party> {
    return this.http.put<Party>(`${ApiService.base}parties/${id}`, { title }).pipe();
  }

  /**
   * Delete a party
   *
   * @param id Party ID
   */
  deleteParty(id: string): Observable<void> {
    return this.http.delete<void>(`${ApiService.base}parties/${id}`).pipe();
  }

  /**
   * Update category
   *
   * @param id Category ID
   * @param name New category name
   */
  updateCategory(id: number, name: string): Observable<Category> {
    return this.http.patch<Category>(`${ApiService.base}party-categories/${id}`, { name }).pipe();
  }

  /**
   * Get party user list
   *
   * @param params Filter data
   */
  getPartyUsers(params?: { user?: string, party?: string, }): Observable<ApiResponse<PartyUser>> {
    return this.http.get<ApiResponse<PartyUser>>(`${ApiService.base}party-users/`, { params }).pipe();
  }

  /**
   * Create a party user (Make authenticated join a party)
   *
   * @param party Party ID
   */
  createPartyUsers(party: string): Observable<PartyUser> {
    return this.http.post<PartyUser>(`${ApiService.base}party-users/`, { party }).pipe();
  }

  /**
   * Get song list
   *
   * @param party Song party ID
   */
  getSongs(party: string): Observable<ApiResponse<Song>> {
    return this.http.get<ApiResponse<Song>>(`${ApiService.base}songs/`, {
      params: { party },
    }).pipe();
  }

  /**
   * Delete a song
   *
   * @param id Song ID
   */
  deleteSong(id: number): Observable<void> {
    return this.http.delete<void>(`${ApiService.base}songs/${id}`).pipe();
  }

  /**
   * Add song to party
   *
   * @param party Party ID to add song to
   * @param source song URL
   */
  addSong(party: string, source: string): Observable<Song> {
    return this.http.post<Song>(`${ApiService.base}songs/`,  { party, source }).pipe();
  }

  /**
   * Update user
   *
   * @param username User username
   * @param payload Update data
   */
  updateUser(username: string, payload: Account): Observable<Account> {
    return this.http.put<Account>(`${ApiService.base}accounts/${username}`, payload).pipe();
  }

  /**
   * Delete party user (party member)
   *
   * @param id Party user ID
   */
  deletePartyUser(id: number): Observable<void> {
    return this.http.delete<void>(`${ApiService.base}party-users/${id}`).pipe();
  }

  /**
   * Create a new category for party
   *
   * @param party Party ID to add category to
   * @param name Category name
   */
  addCategory(party: string, name: string): Observable<Category> {
    return this.http.post<Category>(`${ApiService.base}party-categories/`, { party, name }).pipe();
  }

  /**
   * Delete a category
   *
   * @param id Category ID to delete
   */
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${ApiService.base}party-categories/${id}`).pipe();
  }

  /**
   * @todo
   */
  searchYouTube() {
    return this.http.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'id,snipped',
        maxResults: '12',
        q: 'muse',
        type: 'video',
        videoCategory: '10',
        key: 'AIzaSyBvPUNQMo3udOQ3EgSUF9_RMM1xA60-03I'
      },
    });
  }
}
